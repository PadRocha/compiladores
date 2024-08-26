import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { exit } from "process";

class Translate {
  tokens: Map<string, string>;
  private count_c: number;

  constructor(public line: string) {
    this.tokens = new Map();
    this.count_c = 0;
  }

  private clean(line: string) {
    let accumulator = "";
    let last = "";
    let temp = "";
    let is_log = false;

    for (const char of line) {
      if (/\s/.test(char)) continue;

      if (temp === "l" && char === "o") {
        temp += char;
        continue;
      } else if (temp === "lo" && char === "g") {
        temp += char;
        is_log = true;
        if (!!last && !/[+\-*^\\(/]/.test(last)) {
          accumulator += "*";
        }
        continue;
      } else if (temp.length > 0) {
        accumulator += temp;
        temp = "";
      }

      if (is_log) {
        if (char == "_") {
          temp += last = char;
          continue;
        } else if (last == "_" && /[\d]/.test(char)) {
          temp += char;
          continue;
        } else if (char === "(") {
          accumulator += temp + char;
          is_log = false;
          temp = "";
          continue;
        } else {
          throw new SyntaxError("La expresión del logaritmo no es válida.");
        }
      }

      if (char === "l") {
        temp = "l";
        continue;
      }

      if (!!last) {
        if (/[+\-^]/.test(last) && last === char) continue;

        if ((char === "\\" || char === "(") && !/[+\-*^\\(/]/.test(last)) {
          accumulator += "*";
          last = "*";
        }

        if (last === "*" && char === "*") {
          accumulator += "0";
          last = "0";
        }
      }

      accumulator += char;
      last = char;
    }

    return accumulator;
  }

  private process(line: string, is_root: boolean = false): string {
    const open_c = is_root ? "\\" : "(";
    const close_c = is_root ? "/" : ")";
    let accumulator = "";
    let count_c = 0;
    let index = 0;
    let is_digit = true;

    if (!/[()\\/]/.test(line)) return line;

    for (let i = line.length - 1; i >= 0; i--) {
      const char = line[i];
      if (char === close_c) {
        if (count_c === 0) {
          index = i + (is_root ? 0 : 1);
          count_c = 1;
        } else {
          count_c++;
          accumulator = char + accumulator;
        }
      } else if (char === open_c) {
        if (count_c === 1) {
          if (!is_digit || !is_root) {
            const token = "&" + this.count_c++;
            const start = i + (is_root ? 1 : 0);
            line = line.slice(0, start) + token + line.slice(index);
            accumulator = this.transform(accumulator);
            this.tokens.set(token, accumulator);
          }
          count_c = 0;
          is_digit = true;
          accumulator = "";
        } else {
          count_c--;
          if (count_c < 0) {
            throw new SyntaxError("Falta cerrar un paréntesis o raíz.");
          }
          accumulator = char + accumulator;
        }
      } else if (count_c > 0) {
        accumulator = char + accumulator;
        if (!/[&\d\w]/.test(char)) {
          is_digit = false;
        }
      }
    }

    if (count_c > 0) {
      throw new SyntaxError("Hay un paréntesis o raiz sin abrir.");
    }

    return line;
  }

  private transform(line: string): string {
    return this.process(this.process(line), true);
  }

  private translate(line: string): string {
    let is_root = false;
    let is_power = false;
    let is_logarithm = false;
    let radical = false;
    let base = false;
    let argument = false;
    let aux = "";
    let accumulator = "";
    let lhs = "";
    let rhs = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (/\s/.test(char)) continue;

      if (is_root) {
        if (radical) {
          if (i == line.length - 1 || /[+\-*:^=]/.test(char)) {
            if (/^&\d+$/.test(lhs)) {
              const token = this.tokens.get(lhs);
              if (!!token) {
                lhs = "(" + this.translate(token) + ")";
              }
            }
            if (i == line.length - 1) {
              rhs += char;
            }
            rhs = this.translate(rhs);
            if (!/[&^]/.test(char)) {
              if (lhs === "2") {
                accumulator += `sqrt(${rhs})`;
              } else {
                accumulator += `pow(${rhs}, 1/${lhs})`;
              }
              if (/[+\-*:=]/.test(char)) {
                accumulator += char;
              }
            } else {
              if (lhs === "2") {
                aux = `sqrt(${rhs})`;
              } else {
                aux = `pow(${rhs}, 1/${lhs})`;
              }
            }
            is_root = false;
            radical = false;
            lhs = "";
            rhs = "";
          } else {
            rhs += char;
          }
        } else if (char === "/") {
          radical = true;
        } else {
          lhs += char;
        }
      } else if (char === "\\") {
        is_root = true;
      } else if (!is_power && !is_logarithm && !/[\^]/.test(char)) {
        if (/[+\-*:]/.test(char)) {
          if (/^&\d+/.test(aux)) {
            const token = this.tokens.get(aux);
            if (!!token) {
              aux = "(" + this.translate(token) + ")";
            }
          }
          accumulator += aux + char;
          aux = "";
        } else {
          aux += char;
        }
        if (i == line.length - 1) {
          if (/^&\d+/.test(aux)) {
            const token = this.tokens.get(aux);
            if (!!token) {
              aux = "(" + token + ")";
            }
          }
          accumulator += aux;
          aux = "";
        }
      }

      if (is_logarithm) {
        if (base) {
          if (argument) {
            if (i == line.length - 1 || /[+\-*:^=]/.test(char)) {
              rhs = "&" + rhs;
              if (i == line.length - 1) {
                rhs += char;
              }
              if (/^&\d+$/.test(rhs)) {
                const token = this.tokens.get(rhs);
                if (!!token) {
                  rhs = this.translate(token);
                }
              }

              if (!/[&^]/.test(char)) {
                accumulator += `log(${rhs})/log(${lhs})`;
                if (/[+\-*:=]/.test(char)) {
                  accumulator += char;
                }
              } else {
                aux = `log(${rhs})/log(${lhs})`;
              }
              is_logarithm = false;
              base = false;
              argument = false;
              lhs = "";
              rhs = "";
            } else {
              rhs += char;
            }
          } else if (char === "&") {
            argument = true;
          } else {
            lhs += char;
          }
        } else if (char === "_") {
          base = true;
        } else if (i == line.length - 1 || /[+\-*:^]/.test(char)) {
          if (i == line.length - 1) {
            rhs += char;
          }
          if (/^&\d+$/.test(rhs)) {
            const token = this.tokens.get(rhs);
            if (!!token) {
              rhs = this.translate(token);
            }
          }

          if (!/[&^]/.test(char)) {
            accumulator += `log(${rhs})`;
            if (/[+\-*:]/.test(char)) {
              accumulator += char;
            }
          } else {
            aux = `log(${rhs})`;
          }

          is_logarithm = false;
          base = false;
          rhs = "";
        } else if (!argument) {
          rhs += char;
        }
      } else if (aux == "log") {
        is_logarithm = true;
        aux = "";
      }

      if (is_power) {
        if (i == line.length - 1 || /[+\-*:=]/.test(char)) {
          if (/^&\d+$/.test(aux)) {
            const token = this.tokens.get(aux);
            if (!!token) {
              lhs = this.translate(token);
            }
          }
          if (i == line.length - 1) {
            rhs += char;
          }
          rhs = this.translate(rhs);
          accumulator += `pow(${aux}, ${rhs})`;
          if (/[+\-*:=]/.test(char)) {
            accumulator += char;
          }
          is_power = false;
          aux = "";
          rhs = "";
        } else {
          rhs += char;
        }
      } else if (!!aux && char === "^") {
        is_power = true;
      }
    }

    return accumulator;
  }

  public get convert(): string {
    const line = this.clean(this.line);
    return this.translate(this.transform(line));
  }
}

(async () => {
  const DIR = resolve("files");
  if (!existsSync(DIR)) {
    mkdirSync(DIR, { recursive: true });
  }
  const READ = resolve(DIR, "M.txt");
  if (!existsSync(READ)) {
    console.error("El archivo no existe");
  }
  const lines = readFileSync(READ, "utf-8");
  const new_array = [];
  for (const line of lines.split("\n")) {
    const translate = new Translate(line);
    const new_line = translate.convert;
    new_array.push(new_line);
  }
  const WRITE = resolve(DIR, "C.txt");
  writeFileSync(WRITE, new_array.join("\n"), "utf-8");

  return exit(1);
})();
