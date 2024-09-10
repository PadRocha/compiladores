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
 *
 * @class
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
 * Representa un error relacionado con una expresión matemática inválida.
 *
 * @class
 * @extends {Error}
 */
class ExpressionError extends Error {
  /**
   * Construye un ExpressionError con una lista de errores.
   *
   * @param {string[]} errors - La lista de errores encontrados en la expresión.
   */
  constructor(public errors: string[]) {
    super("Expression contains errors");
  }
}

/**
 * Clase que representa el árbol de operaciones ternarias.
 * El árbol se construye a partir de una expresión matemática.
 *
 * @class
 */
class TernaryTree {
  private root: TernaryNode | null;
  private index: number;
  private errors: string[] = [];
  private intermediate_code: string[] = [];
  private memory_index = 0;

  /**
   * @param {string} expression - La expresión matemática que será parseada en un árbol.
   */
  constructor(expression: string) {
    // Tokenizamos la expresión.
    const tokens = this.tokenize(expression);
    this.root = null;
    this.index = 0;
    this.validateTokens(tokens);
    // En caso de encontrar errores interrumpe el proceso
    if (this.errors.length > 0) {
      throw new ExpressionError(this.errors);
    }
    // Parseamos la expresión en un árbol.
    this.root = this.parseExpression(tokens);
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
   * Genera el código intermedio a partir del árbol ternario.
   *
   * @returns {string[]} El código intermedio en formato de arreglo de cadenas.
   */
  public generateIntermediateCode(): string[] {
    this.intermediate_code = [];
    if (this.root) {
      this.traverseTree(this.root);
    }
    return this.intermediate_code;
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
    let decimalPointCount = 0;

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
        if (/[\d]/.test(char)) {
          numberBuffer += char;
        } else if (char === ".") {
          decimalPointCount++;
          if (decimalPointCount > 1) {
            this.errors.push(`Invalid number format: ${numberBuffer + char}`);
          }
          numberBuffer += char;
        } else {
          if (numberBuffer) {
            tokens.push(numberBuffer);
            numberBuffer = "";
            decimalPointCount = 0;
          }

          // Agregamos otros caracteres no numéricos como operadores.
          if (/\S/.test(char)) {
            tokens.push(char);
          }
        }
      }
    }

    if (numberBuffer) {
      // Agregamos cualquier número restante al final.
      tokens.push(numberBuffer);
    }

    return tokens;
  }

  /**
   * Valida los tokens extraídos de la expresión para detectar errores de sintaxis.
   *
   * @param {string[]} tokens - El arreglo de tokens a validar.
   */
  private validateTokens(tokens: string[]) {
    let openParentheses = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === "(") openParentheses++;
      if (token === ")") openParentheses--;
      if (openParentheses < 0)
        this.errors.push("Unmatched closing parenthesis");

      if (/[+\-*/^]/.test(token) && /[+\-*/^]/.test(tokens[i + 1])) {
        this.errors.push(`Operator repetition: "${tokens[i]}${tokens[i + 1]}"`);
      }

      if (/[+*/^]/.test(token) && (i === 0 || i === tokens.length - 1)) {
        this.errors.push(`Incomplete operation near "${token}"`);
      }
    }

    if (openParentheses !== 0) {
      this.errors.push("Unmatched opening parenthesis");
    }
  }

  /**
   * Función principal que comienza el proceso de parseo de la expresión.
   *
   * @param {string[]} tokens - Lista de tokens de la expresión matemática.
   * @returns {TernaryNode | null} - Nodo raíz del árbol generado.
   */
  private parseExpression(tokens: string[]): TernaryNode | null {
    // Comenzamos por la operación de menor precedencia.
    return this.parseAdditionSubtraction(tokens);
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
        // Saltamos el paréntesis izquierdo
        this.index++;
        // Parseamos la expresión dentro de los paréntesis
        logNode.middle = this.parseAdditionSubtraction(tokens);
        // Saltamos el paréntesis derecho
        if (tokens[this.index] === ")") this.index++;
      }
      return logNode;
    }

    // Parseo de raíces cuadradas (sqrt)
    if (token === "sqrt") {
      this.index++;
      const sqrtNode = new TernaryNode("sqrt");
      if (tokens[this.index] === "(") {
        // Saltamos el paréntesis izquierdo
        this.index++;
        // Parseamos la expresión dentro de los paréntesis
        sqrtNode.middle = this.parseAdditionSubtraction(tokens);
        // Saltamos el paréntesis derecho
        if (tokens[this.index] === ")") this.index++;
      }
      return sqrtNode;
    }

    // Parseo de tokens negativos
    if (token === "-") {
      // Saltamos al token izquierdo
      this.index++;
      const negNode = new TernaryNode("-");
      negNode.middle = this.parsePrimary(tokens);
      return negNode;
    }

    // Parseo de expresiones entre paréntesis
    if (token === "(") {
      this.index++;
      // Parseamos el contenido del paréntesis
      const node = this.parseAdditionSubtraction(tokens);
      if (tokens[this.index] === ")") {
        // Saltamos el paréntesis derecho
        this.index++;
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
      // El exponente es una expresión primaria
      opNode.middle = this.parsePrimary(tokens);
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
      // El operando derecho es una operación de exponenciación
      opNode.right = this.parseExponent(tokens);
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
      // El operando derecho es una multiplicación/división
      opNode.right = this.parseMultiplicationDivision(tokens);
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
    return `(${leftStr} ${node.value} ${middleStr} ${rightStr})`;
  }

  /**
   * Recorre el árbol ternario y genera el código intermedio para la evaluación de la expresión.
   *
   * @param {TernaryNode | null} node - El nodo actual del árbol a recorrer.
   * @returns {number} El índice en el que se almacena el resultado de la operación actual.
   */
  private traverseTree(node: TernaryNode | null): number {
    if (!node) return -1;
    if (!node.left && !node.middle && !node.right) {
      const varIndex = this.memory_index++;
      this.intermediate_code.push(`a[${varIndex}] = ${node.value}`);
      return varIndex;
    }

    const left = this.traverseTree(node.left);
    const middle = this.traverseTree(node.middle);
    const right = this.traverseTree(node.right);
    const resultIndex = this.memory_index++;

    switch (node.value) {
      case "+":
      case "-":
      case "*":
      case "/":
        this.intermediate_code.push(
          `a[${resultIndex}] = a[${left}] ${node.value} a[${right}]`,
        );
        break;
      case "^":
        this.intermediate_code.push(
          `a[${resultIndex}] = pow(a[${left}], a[${middle}])`,
        );
        break;
      case "log":
        this.intermediate_code.push(`a[${resultIndex}] = log(a[${middle}])`);
        break;
      case "sqrt":
        this.intermediate_code.push(`a[${resultIndex}] = sqrt(a[${middle}])`);
        break;
      case "-":
        this.intermediate_code.push(`a[${resultIndex}] = -a[${middle}]`);
        break;
    }

    return resultIndex;
  }
}

// Función autoejecutable para solicitar una expresión y visualizar el árbol de operaciones.
(async () => {
  try {
    // Solicita al usuario ingresar una expresión matemática.
    const expression = await getLine("Ingresa expresión: ");
    const tree = new TernaryTree(expression);
    // Visualiza el árbol en la consola.
    tree.visualize();
    // Genera el código intermedio
    const intermediate_code = tree.generateIntermediateCode();
    console.log(intermediate_code.join("\n"));
  } catch (error) {
    if (error instanceof ExpressionError) {
      console.error("Errores encontrados:", error.errors);
    } else {
      console.error("Error inesperado: ", error);
    }
    return exit(1);
  }
  return exit(0);
})();
