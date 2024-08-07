// Importamos las funciones necesarias para interactuar con la entrada y salida estándar
import { stdin, stdout, exit } from "process";
import { createInterface } from "readline";

// Definimos una función asincrónica que solicita una línea de entrada al usuario
async function getLine(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((response) => {
    rl.question(question, (line) => {
      rl.close();
      return response(line);
    });
  });
}

// Definimos una función para convertir una cadena en un número (flotante o entero)
function castNumber(line: string): string {
  let bool = false;
  let res = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (/\d/.test(char)) {
      // Si el carácter es un dígito, lo agregamos al resultado
      res += char;
    } else if (char === ".") {
      if (!bool) {
        bool = true;
        // Si hay solo un punto, no es válido
        if (line.length === 1) break;
        // Agregamos el punto al resultado
        res += char;
      } else {
        // Si ya había un punto, reiniciamos el resultado
        res = "";
        break;
      }
    } else if (res == '.' && i == line.length - 1) {
      // Si la cadena comienza con un punto, no es válido
      res = "";
    }
  }
  // Devolvemos el resultado o "NaN" si no se encontraron dígitos
  return res || "NaN";
}

// Función principal (IIFE) que ejecuta todo el programa
(async () => {
  // Solicitamos al usuario que ingrese un valor
  const line = await getLine("Ingresa valor: ");
  const num = castNumber(line); // Convertimos la entrada en un número
  if (num !== "NaN") {
    // Dividimos el número en parte entera y decimal
    const [entero, decimal] = num.split(".");
    if (!entero) {
      // Si no hay parte entera, es un flotante menor a 1
      console.log("0.%d es flotante", decimal);
    } else if (decimal) {
      // Si hay parte decimal, es un flotante
      console.log("%d.%d es flotante", entero, decimal);
    } else {
      // Si no hay parte decimal, es un entero
      console.log(entero, "es entero");
    }
  } else {
    // Si no se pudo convertir a número, es inválido
    console.log("Valor no válido");
  }
  // Salimos del programa
  return exit(0);
})();
