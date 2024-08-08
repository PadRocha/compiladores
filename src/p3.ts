class Translate {
  public tokens: Map<string, string>;
  private token_count: number;

  constructor(public line: string) {
    this.tokens = new Map();
    this.token_count = 0;
  }

  private process(line: string, is_root: boolean = false): string {
    const char_s = is_root ? "\\" : "(";
    const char_e = is_root ? "/" : ")";
    let counter = 0;
    let flag = false;
    let accumulator = "";
    let index = 0;
    let is_digit = true;

    if (!/[()\\/]/.test(line)) return line;

    for (let i = line.length - 1; i >= 0; i--) {
      const char = line[i];
      if (/\s/.test(char)) continue;
      if (char === char_e) {
        if (!flag) {
          flag = true;
          index = i + (is_root ? 0 : 1);
        } else {
          counter++;
          accumulator = char + accumulator;
        }
      } else if (char === char_s) {
        if (counter > 0) {
          counter--;
          accumulator = char + accumulator;
        } else {
          if (!is_digit || !is_root) {
            const token = `&${this.token_count++}`;
            const start = i + (is_root ? 1 : 0);
            line = line.slice(0, start) + token + line.slice(index);
            accumulator = this.transform(accumulator);
            this.tokens.set(token, accumulator);
          }
          flag = false;
          is_digit = true;
          accumulator = "";
        }
      } else if (flag) {
        accumulator = char + accumulator;
        if (!/[&\d\w]/.test(char)) {
          is_digit = false;
        }
      }
    }

    return line;
  }

  private transform(line: string): string {
    return this.process(this.process(line), true);
  }

  private translate(line: string): string {
    let flag = false;
    let radical = false;
    let accumulator = "";
    let op = 0;
    let aux = "";
    let lhs = "";
    let rhs = "";
    let is_token = true;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (/\s/.test(char)) continue;
      // if (/[+\-*:\\/]/.test(char) && !flag) {
      //   lhs = "";
      //   flag = true;
      // } else {
      //   lhs += char;
      // }

      if (flag) {
        if (radical) {
          if (i == line.length - 1 || /[+\-*:^]/.test(char)) {
            if (i == line.length - 1) {
              rhs += char;
            }
            if (lhs === "2") {
              accumulator += `sqrt(${rhs})`;
            } else {
              accumulator += `pow(${rhs}, 1 / (${lhs}))`;
            }
            flag = false;
            radical = false;
            lhs = "";
            rhs = "";
            if (/[+\-*:^]/.test(char)) {
              accumulator += char;
            }
          } else {
            console.log("reading rhs");
            rhs += char;
          }
        } else if (char === "/") {
          radical = true;
        } else {
          lhs += char;
        }
      } else if (char === "\\") {
        flag = true;
      } else {
        accumulator += char;
      }

      // if (/[&\d\w]/.test(char)) {
      //   if (/[^&\d]/.test(char)) {
      //     is_token = false;
      //   }
      //   if (!flag) {
      //     lhs += char;
      //   } else {
      //     rhs += char;
      //   }
      // } else {
      //   if (char === "\\") {
      //     flag = true;
      //   }
      // }
    }

    return accumulator;
  }

  public get converted(): string {
    return this.translate(this.transform(this.line));
  }
}

(async () => {
  // const line = `31^n*(\\(23*3)/3+(9*8))*8-(3*8)*\\8-8/32`;
  // const line = `8 + \\3 + 8/(a * 8 - 8) + 8`;
  const line = "\\2/\\2/3+\\4/3";
  console.log("Original:", line);
  const conv = new Translate(line);
  console.log("Traducido:", conv.converted);
  console.log(conv.tokens);
})();
