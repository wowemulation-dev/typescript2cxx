import { describe, it } from "@std/testing/bdd";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Rest Parameters", () => {
  describe("Basic Rest Parameters", () => {
    it("should handle simple rest parameters with numbers", async () => {
      const input = `
function sum(...numbers: number[]): number {
    let total = 0;
    for (const num of numbers) {
        total += num;
    }
    return total;
}

const result = sum(1, 2, 3, 4, 5);
console.log(result);
`;

      await runEndToEndTest(input, "15.000000");
    });

    it("should handle rest parameters with strings", async () => {
      const input = `
function concatenate(...strings: string[]): string {
    let result = "";
    for (const str of strings) {
        result += str;
    }
    return result;
}

const result = concatenate("Hello", " ", "World", "!");
console.log(result);
`;

      await runEndToEndTest(input, "Hello World!");
    });

    it("should handle rest parameters with any type", async () => {
      const input = `
function logAll(...items: any[]): void {
    for (const item of items) {
        console.log(item);
    }
}

logAll("hello", 42, true);
`;

      await runEndToEndTest(input, "hello\n42\ntrue");
    });
  });

  describe("Rest Parameters with Regular Parameters", () => {
    it("should handle mixed parameters (regular + rest)", async () => {
      const input = `
function greetAll(greeting: string, ...names: string[]): string {
    let result = greeting + " ";
    for (let i = 0; i < names.length(); i++) {
        result += names[i];
        if (i < names.length() - 1) {
            result += ", ";
        }
    }
    return result;
}

const result = greetAll("Hello", "Alice", "Bob", "Charlie");
console.log(result);
`;

      await runEndToEndTest(input, "Hello Alice, Bob, Charlie");
    });

    it("should handle optional parameter before rest parameters", async () => {
      const input = `
function processItems(prefix?: string, ...items: number[]): string {
    let result = prefix || "Items: ";
    for (const item of items) {
        result += item + " ";
    }
    return result.trim();
}

const result1 = processItems("Numbers: ", 1, 2, 3);
const result2 = processItems(undefined, 4, 5, 6);
console.log(result1);
console.log(result2);
`;

      await runEndToEndTest(input, "Numbers: 1 2 3\nItems: 4 5 6");
    });
  });

  describe("Rest Parameters in Different Contexts", () => {
    it("should handle rest parameters in arrow functions", async () => {
      const input = `
const multiply = (...numbers: number[]) => {
    let result = 1;
    for (const num of numbers) {
        result *= num;
    }
    return result;
};

const result = multiply(2, 3, 4);
console.log(result);
`;

      await runEndToEndTest(input, "24");
    });

    it("should handle rest parameters in class methods", async () => {
      const input = `
class Calculator {
    add(...numbers: number[]): number {
        let sum = 0;
        for (const num of numbers) {
            sum += num;
        }
        return sum;
    }
}

const calc = new Calculator();
const result = calc.add(10, 20, 30);
console.log(result);
`;

      await runEndToEndTest(input, "60");
    });

    it("should handle empty rest parameters", async () => {
      const input = `
function countArgs(...args: any[]): number {
    return args.length();
}

const result1 = countArgs();
const result2 = countArgs(1, 2, 3);
console.log(result1);
console.log(result2);
`;

      await runEndToEndTest(input, "0\n3");
    });
  });

  describe("Type System Integration", () => {
    it("should handle rest parameters with union types", async () => {
      const input = `
function processValues(...values: (string | number)[]): string {
    let result = "";
    for (const value of values) {
        if (typeof value === "string") {
            result += value + " ";
        } else {
            result += value.toString() + " ";
        }
    }
    return result.trim();
}

const result = processValues("hello", 42, "world", 99);
console.log(result);
`;

      await runEndToEndTest(input, "hello 42 world 99");
    });
  });

  describe("Edge Cases", () => {
    it("should handle nested function calls with rest parameters", async () => {
      const input = `
function sum(...numbers: number[]): number {
    let total = 0;
    for (const num of numbers) {
        total += num;
    }
    return total;
}

function average(...numbers: number[]): number {
    const total = sum(...numbers);
    return total / numbers.length();
}

const result = average(10, 20, 30);
console.log(result);
`;

      await runEndToEndTest(input, "20");
    });
  });
});
