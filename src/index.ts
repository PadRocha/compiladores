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
  let success!: boolean;
  let line = await getLine("Ingresa una frase: ");
  const clean_line = line.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ");
  const line_set = new Set(clean_line.split(" "));
  for (const word of line_set) {
    if (dic.has(word)) {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      line = line.replace(regex, dic.get(word) || "");
    }
  }
  console.log(line);

  return exit(0);
  do {
    const line = await getLine("Ingresa palabra: ");
    if (!dic.has(line)) {
      console.log("Esa palabra no existe, prueba de nuevo");
      success = false;
    } else {
      console.log(`Español: ${line}\nInglés: ${dic.get(line)}`);
      success = true;
    }
  } while (!success);
})();
