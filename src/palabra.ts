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

  return exit(0);
})();
