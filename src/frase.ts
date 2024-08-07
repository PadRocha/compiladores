import { createInterface } from "readline";
import { stdin, stdout, exit } from "process";
import { dictionary } from "./dictionary.json";

function getLine(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });

  return new Promise((response) => {
    rl.question(question, (line) => {
      rl.close();
      response(line);
    });
  });
}

(async () => {
  const dic = new Map(Object.entries(dictionary));
  let line = (await getLine("Ingresa una frase: ")).toLowerCase();
  const line_set = new Set(line.split(/[^a-zA-Z]+/));
  for (const word of line_set) {
    if (dic.has(word)) {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      line = line.replace(regex, dic.get(word) || "");
    }
  }
  console.log(line);

  return exit(0);
})();
