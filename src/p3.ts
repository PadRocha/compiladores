class Translate {
  public ph_map: Map<string, string>;
  private token_count: number;

  constructor(public line: string) {
    this.ph_map = new Map();
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
            this.ph_map.set(token, accumulator);
          }
          flag = false;
          is_digit = true;
          accumulator = "";
        }
      } else if (flag) {
        accumulator = char + accumulator;
        if (!/[\d\w&]/.test(char)) {
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
    let accumulator = "";
    let op = "";
    let aux = "";
    let lhs = "";
    let rhs = "";
    let is_token = true;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === "\\" && !flag) {
        flag = true;
        op = "sqrt";
        aux = "*";
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

    console.log(lhs, rhs, is_token);

    return line;
  }

  public get converted(): string {
    return this.translate(this.transform(this.line));
  }
}

(async () => {
  // const line = `31^n*(\\(23*3)/3+(9*8))*8-(3*8)*\\8-8/32`;
  const line = `\\3+8/(a*8-8)`;
  console.log("Texto original:", line);
  const conv = new Translate(line);
  console.log("Texto con tokens:", conv.converted);
  console.log(conv.ph_map);
})();
