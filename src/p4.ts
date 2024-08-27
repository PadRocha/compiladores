import {stdin, stdout, exit} from "process";
import {createInterface} from "readline";

/**
 * Solicita una línea de entrada al usuario de forma asíncrona.
 *
 * @param {string} question - La pregunta que se le hará al usuario.
 * @returns {Promise<string>} - Una promesa que se resuelve con la línea de entrada del usuario.
 */
async function getLine(question: string): Promise<string> {
  const rl = createInterface({input: stdin, output: stdout});
  return new Promise((response) => {
    rl.question(question, (line) => {
      rl.close();
      return response(line);
    });
  });
}

/**
 * Clase que representa un nodo en el árbol de operaciones ternarias.
 * Cada nodo puede tener tres hijos (izquierdo, medio, derecho).
 */
class TernaryNode {
  public left: TernaryNode | null;
  public middle: TernaryNode | null;
  public right: TernaryNode | null;

  /**
   * @param {string} value - El valor del nodo (un operador o un número).
   */
  constructor(public value: string) {
    this.left = null;
    this.middle = null;
    this.right = null;
  }
}

/**
 * Clase que representa el árbol de operaciones ternarias.
 * El árbol se construye a partir de una expresión matemática.
 */
class TernaryTree {
  private root: TernaryNode | null;
  private index: number;

  /**
   * @param {string} expression - La expresión matemática que será parseada en un árbol.
   */
  constructor(expression: string) {
    const tokens = this.tokenize(expression); // Tokenizamos la expresión.
    this.root = null;
    this.index = 0;
    this.root = this.parseExpression(tokens); // Parseamos la expresión en un árbol.
  }

  /**
   * Visualiza el árbol en la consola, mostrando su estructura jerárquica.
   */
  public visualize(): void {
    if (this.root) {
      this.printTree(this.root, "", true);
    }
  }

  /**
   * Convierte el árbol de operaciones en una cadena de texto.
   *
   * @returns {string} - Una representación en cadena del árbol.
   */
  public toString(): string {
    return this.root ? this.nodeToString(this.root) : "";
  }

  /**
   * Convierte el árbol de operaciones a código C.
   *
   * @returns {string} - Representación en cadena del árbol en sintaxis C.
   */
  public toCCode(): string {
    return this.root ? this.nodeToCCode(this.root) : "";
  }

  /**
   * Convierte una expresión en una lista de tokens.
   *
   * @param {string} expression - La expresión matemática a tokenizar.
   * @returns {string[]} - Lista de tokens que representan la expresión.
   */
  private tokenize(expression: string): string[] {
    const tokens: string[] = [];
    let numberBuffer = "";
    let functionBuffer = "";

    // Recorremos cada carácter de la expresión.
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];

      // Detectamos funciones como 'log' y 'sqrt'
      if (/[a-z]/i.test(char)) {
        functionBuffer += char;
        if (functionBuffer === "log" || functionBuffer === "sqrt") {
          tokens.push(functionBuffer);
          functionBuffer = "";
        }
      } else {
        if (functionBuffer) {
          tokens.push(functionBuffer);
          functionBuffer = "";
        }

        // Detectamos números y el punto decimal.
        if (/[\d\.]/.test(char)) {
          numberBuffer += char;
        } else {
          if (numberBuffer) {
            tokens.push(numberBuffer);
            numberBuffer = "";
          }

          // Agregamos otros caracteres no numéricos como operadores.
          if (/\S/.test(char)) {
            tokens.push(char);
          }
        }
      }
    }

    if (numberBuffer) {
      tokens.push(numberBuffer); // Agregamos cualquier número restante al final.
    }

    return tokens;
  }

  /**
   * Función principal que comienza el proceso de parseo de la expresión.
   *
   * @param {string[]} tokens - Lista de tokens de la expresión matemática.
   * @returns {TernaryNode | null} - Nodo raíz del árbol generado.
   */
  private parseExpression(tokens: string[]): TernaryNode | null {
    return this.parseAdditionSubtraction(tokens); // Comenzamos por la operación de menor precedencia.
  }

  /**
   * Parseo de los elementos primarios como números, logaritmos, raíces o paréntesis.
   *
   * @param {string[]} tokens - Lista de tokens de la expresión matemática.
   * @returns {TernaryNode | null} - Nodo correspondiente al término primario.
   */
  private parsePrimary(tokens: string[]): TernaryNode | null {
    let token = tokens[this.index];

    // Parseo de logaritmos (log)
    if (token === "log") {
      this.index++;
      const logNode = new TernaryNode("log");
      if (tokens[this.index] === "(") {
        this.index++; // Saltamos el paréntesis izquierdo
        logNode.middle = this.parseAdditionSubtraction(tokens); // Parseamos la expresión dentro de los paréntesis
        if (tokens[this.index] === ")") this.index++; // Saltamos el paréntesis derecho
      }
      return logNode;
    }

    // Parseo de raíces cuadradas (sqrt)
    if (token === "sqrt") {
      this.index++;
      const sqrtNode = new TernaryNode("sqrt");
      if (tokens[this.index] === "(") {
        this.index++; // Saltamos el paréntesis izquierdo
        sqrtNode.middle = this.parseAdditionSubtraction(tokens); // Parseamos la expresión dentro de los paréntesis
        if (tokens[this.index] === ")") this.index++; // Saltamos el paréntesis derecho
      }
      return sqrtNode;
    }

    // Parseo de expresiones entre paréntesis
    if (token === "(") {
      this.index++;
      const node = this.parseAdditionSubtraction(tokens); // Parseamos el contenido del paréntesis
      if (tokens[this.index] === ")") {
        this.index++; // Saltamos el paréntesis derecho
      }
      return node;
    }

    // Caso por defecto: retornamos el número u operador
    this.index++;
    return new TernaryNode(token);
  }

  /**
   * Parseo de operaciones de exponenciación.
   *
   * @param {string[]} tokens - Lista de tokens de la expresión matemática.
   * @returns {TernaryNode | null} - Nodo que representa una operación de exponenciación.
   */
  private parseExponent(tokens: string[]): TernaryNode | null {
    let node = this.parsePrimary(tokens);
    while (this.index < tokens.length && tokens[this.index] === "^") {
      const opNode = new TernaryNode(tokens[this.index++]);
      opNode.left = node;
      opNode.middle = this.parsePrimary(tokens); // El exponente es una expresión primaria
      node = opNode;
    }
    return node;
  }

  /**
   * Parseo de operaciones de multiplicación y división.
   *
   * @param {string[]} tokens - Lista de tokens de la expresión matemática.
   * @returns {TernaryNode | null} - Nodo que representa una operación de multiplicación o división.
   */
  private parseMultiplicationDivision(tokens: string[]): TernaryNode | null {
    let node = this.parseExponent(tokens);
    while (
      this.index < tokens.length &&
      (tokens[this.index] === "*" || tokens[this.index] === "/")
    ) {
      const opNode = new TernaryNode(tokens[this.index++]);
      opNode.left = node;
      opNode.right = this.parseExponent(tokens); // El operando derecho es una operación de exponenciación
      node = opNode;
    }
    return node;
  }

  /**
   * Parseo de operaciones de suma y resta.
   *
   * @param {string[]} tokens - Lista de tokens de la expresión matemática.
   * @returns {TernaryNode | null} - Nodo que representa una operación de suma o resta.
   */
  private parseAdditionSubtraction(tokens: string[]): TernaryNode | null {
    let node = this.parseMultiplicationDivision(tokens);
    while (
      this.index < tokens.length &&
      (tokens[this.index] === "+" || tokens[this.index] === "-")
    ) {
      const opNode = new TernaryNode(tokens[this.index++]);
      opNode.left = node;
      opNode.right = this.parseMultiplicationDivision(tokens); // El operando derecho es una multiplicación/división
      node = opNode;
    }
    return node;
  }

  /**
   * Imprime la estructura del árbol de forma jerárquica en la consola.
   *
   * @param {TernaryNode | null} node - Nodo actual a imprimir.
   * @param {string} indent - Indentación para mantener la jerarquía.
   * @param {boolean} last - Indica si el nodo es el último hijo.
   */
  private printTree(
    node: TernaryNode | null,
    indent: string,
    last: boolean,
  ): void {
    if (node !== null) {
      console.log(indent + (last ? "└── " : "├── ") + node.value);
      const newIndent = indent + (last ? "    " : "│   ");
      const children = [node.left, node.middle, node.right].filter(
        (child) => child !== null,
      );
      // Recorremos los hijos del nodo actual e imprimimos cada uno.
      for (const [i, child] of children.entries()) {
        this.printTree(child, newIndent, i === children.length - 1);
      }
    }
  }

  /**
   * Convierte un nodo del árbol en una cadena de texto en notación infija.
   *
   * @param {TernaryNode | null} node - Nodo que se convertirá a cadena.
   * @returns {string} - Representación en cadena del subárbol.
   */
  private nodeToString(node: TernaryNode | null): string {
    if (!node) return "";
    const leftStr = this.nodeToString(node.left);
    const middleStr = this.nodeToString(node.middle);
    const rightStr = this.nodeToString(node.right);
    // Construye la cadena para el nodo actual en notación infija.
    return `(${leftStr} ${node.value} ${middleStr} ${rightStr})`;
  }

  /**
   * Convierte un nodo del árbol a código C.
   *
   * @param {TernaryNode | null} node - Nodo que se convertirá a código C.
   * @returns {string} - Representación en código C del subárbol.
   */
  private nodeToCCode(node: TernaryNode | null): string {
    if (!node) return "";

    // Convertir el nodo y sus hijos a código C.
    const leftStr = this.nodeToCCode(node.left);
    const middleStr = this.nodeToCCode(node.middle);
    const rightStr = this.nodeToCCode(node.right);

    switch (node.value) {
      case "log":
        return `log(${middleStr})`;
      case "sqrt":
        return `sqrt(${middleStr})`;
      case "^":
        return `pow(${leftStr}, ${middleStr})`;
      case "*":
      case "/":
      case "+":
      case "-":
        return `(${leftStr} ${node.value} ${rightStr})`;
      default:
        return node.value;
    }
  }
}

// Función autoejecutable para solicitar una expresión y visualizar el árbol de operaciones.
(async () => {
  // Solicita al usuario ingresar una expresión matemática.
  const expression = await getLine("Ingresa expresión: ");
  // Crea el árbol de operaciones a partir de la expresión.
  const tree = new TernaryTree(expression);
  // Visualiza el árbol en la consola.
  tree.visualize();
  // Converte el árbol a un código en C
  console.log(tree.toCCode());
  return exit(0); // Termina el proceso con éxito.
})();
