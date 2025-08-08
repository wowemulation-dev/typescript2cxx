import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Functions (Comprehensive - Ported from Prototype)", () => {
  async function testTranspilation(code: string) {
    const result = await transpile(code, {
      outputName: "test",
      standard: "c++20",
    });
    return result;
  }

  async function testE2E(code: string, expectedOutput: string) {
    // First test transpilation
    const result = await testTranspilation(code);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");

    // Then test compilation and execution
    const e2eResult = await runEndToEndTest(code, expectedOutput);
    if (e2eResult?.success === false) {
      console.error("E2E Test failed:", e2eResult.error);
      throw new Error(`E2E test failed: ${e2eResult.error}`);
    }
    assertEquals(e2eResult?.output, expectedOutput);
  }

  it("should handle various function declaration syntaxes", async () => {
    // This test verifies that all function syntaxes compile without errors
    const code = `
      function funcNoParamNoReturn() {
      }

      function funcNoParam() {
        return 1;
      }

      function func(val: number) {
        return 2;
      }

      var funcNoParamNoReturn1 = function () {
      }

      var funcNoParam1 = function () {
        return 1;
      }

      var func1 = function(val: number) {
        return 2;
      }

      var funcNoParamNoReturn2 = () => {
      }

      var funcNoParam2 = () => {
        return 1;
      }

      var func2 = (val: number) => {
        return 2;
      }
    `;

    // This test should produce no output, just verify compilation
    await testE2E(code, "");
  });

  it("should handle optional parameters", async () => {
    const code = `
      function buildName(firstName: string, lastName?: string) {
        if (lastName)
          return firstName + " " + lastName;
        else
          return firstName;
      }

      let result1 = buildName("Bob", "Adams");
      let result2 = buildName("Bob");
      console.log(result1);
      console.log(result2);
    `;

    await testE2E(code, "Bob Adams\nBob\n");
  });

  it("should handle default parameters", async () => {
    const code = `
      function buildName(firstName: string, lastName: string = "Smith") {
        return firstName + " " + lastName;
      }

      let result1 = buildName("Bob", "Adams");
      let result2 = buildName("Bob");
      console.log(result1);
      console.log(result2);
    `;

    await testE2E(code, "Bob Adams\nBob Smith\n");
  });

  it("should handle nested functions and closures", async () => {
    const code = `
      let deck = {
        createCardPicker: function() {
          return function() {
            return {suit: "spades"};
          };
        }
      };

      let cardPicker = deck.createCardPicker();
      let pickedCard = cardPicker();
      console.log(pickedCard.suit);
    `;

    await testE2E(code, "spades\n");
  });

  it("should handle function return types", async () => {
    const code = `
      function returnNumber(): number {
        return 42;
      }

      function returnString(): string {
        return "hello";
      }

      function returnBoolean(): boolean {
        return true;
      }

      console.log(returnNumber());
      console.log(returnString());
      console.log(returnBoolean());
    `;

    await testE2E(code, "42.000000\nhello\ntrue\n");
  });

  it("should handle function parameters with complex types", async () => {
    const code = `
      function processArray(arr: number[]): number {
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          sum += arr[i];
        }
        return sum;
      }

      let numbers = [1, 2, 3, 4, 5];
      console.log(processArray(numbers));
    `;

    await testE2E(code, "15.000000\n");
  });

  it("should handle arrow functions with implicit returns", async () => {
    const code = `
      let add = (a: number, b: number) => a + b;
      let multiply = (a: number, b: number) => a * b;

      console.log(add(3, 4));
      console.log(multiply(3, 4));
    `;

    await testE2E(code, "7.000000\n12.000000\n");
  });

  it("should handle functions as first-class values", async () => {
    const code = `
      function operate(a: number, b: number, operation: (x: number, y: number) => number): number {
        return operation(a, b);
      }

      let add = (x: number, y: number) => x + y;
      let subtract = (x: number, y: number) => x - y;

      console.log(operate(10, 5, add));
      console.log(operate(10, 5, subtract));
    `;

    await testE2E(code, "15.000000\n5.000000\n");
  });

  it("should handle recursive functions", async () => {
    const code = `
      function factorial(n: number): number {
        if (n <= 1) {
          return 1;
        }
        return n * factorial(n - 1);
      }

      console.log(factorial(5));
    `;

    await testE2E(code, "120.000000\n");
  });

  it("should handle function overload concepts (single implementation)", async () => {
    const code = `
      function processValue(value: any): string {
        if (typeof value === "number") {
          return "Number: " + value;
        } else if (typeof value === "string") {
          return "String: " + value;
        } else {
          return "Unknown: " + value;
        }
      }

      console.log(processValue(42));
      console.log(processValue("hello"));
      console.log(processValue(true));
    `;

    await testE2E(code, "Number: 42.000000\nString: hello\nUnknown: true\n");
  });

  it("should handle immediately invoked function expressions (IIFE)", async () => {
    const code = `
      let result = (function() {
        let temp = "IIFE Result";
        return temp;
      })();

      console.log(result);
    `;

    await testE2E(code, "IIFE Result\n");
  });

  it("should handle function expressions in object properties", async () => {
    const code = `
      let calculator = {
        add: function(a: number, b: number): number {
          return a + b;
        },
        multiply: function(a: number, b: number): number {
          return a * b;
        }
      };

      console.log(calculator.add(3, 4));
      console.log(calculator.multiply(3, 4));
    `;

    await testE2E(code, "7.000000\n12.000000\n");
  });
});
