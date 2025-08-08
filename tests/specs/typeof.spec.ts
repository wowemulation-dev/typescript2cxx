import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Typeof Operator - Ported from Prototype", () => {
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

  it("should handle typeof with string literals", async () => {
    const code = `
      console.log(typeof("asd"));
    `;

    await testE2E(code, "string\n");
  });

  it("should handle typeof with all primitive types", async () => {
    const code = `
      console.log(typeof 42);
      console.log(typeof "hello");
      console.log(typeof true);
      console.log(typeof false);
      console.log(typeof undefined);
      console.log(typeof null);
    `;

    await testE2E(code, "number\nstring\nboolean\nboolean\nundefined\nobject\n");
  });

  it("should handle typeof with variables", async () => {
    const code = `
      let num = 123;
      let str = "test";
      let bool = true;
      let undef;
      let nul = null;
      
      console.log(typeof num);
      console.log(typeof str);
      console.log(typeof bool);
      console.log(typeof undef);
      console.log(typeof nul);
    `;

    await testE2E(code, "number\nstring\nboolean\nundefined\nobject\n");
  });

  it("should handle typeof with complex types", async () => {
    const code = `
      let arr = [1, 2, 3];
      let obj = { a: 1, b: 2 };
      function func() { return 42; }
      
      console.log(typeof arr);
      console.log(typeof obj);
      console.log(typeof func);
    `;

    await testE2E(code, "object\nobject\nfunction\n");
  });

  it("should handle typeof in expressions", async () => {
    const code = `
      let x = 42;
      
      if (typeof x === "number") {
        console.log("x is a number");
      }
      
      if (typeof x !== "string") {
        console.log("x is not a string");
      }
      
      let result = typeof x === "number" ? "numeric" : "non-numeric";
      console.log(result);
    `;

    await testE2E(code, "x is a number\nx is not a string\nnumeric\n");
  });

  it("should handle typeof with mathematical expressions", async () => {
    const code = `
      console.log(typeof (2 + 3));
      console.log(typeof (2 * 3.5));
      console.log(typeof (10 / 2));
      console.log(typeof (5 % 2));
    `;

    await testE2E(code, "number\nnumber\nnumber\nnumber\n");
  });

  it("should handle typeof with string concatenation", async () => {
    const code = `
      console.log(typeof ("hello" + " world"));
      console.log(typeof ("number: " + 42));
      console.log(typeof (true + false));
    `;

    await testE2E(code, "string\nstring\nnumber\n");
  });

  it("should handle typeof in conditional contexts", async () => {
    const code = `
      function checkType(value: any): string {
        if (typeof value === "undefined") {
          return "undefined";
        } else if (typeof value === "boolean") {
          return "boolean";
        } else if (typeof value === "number") {
          return "number";
        } else if (typeof value === "string") {
          return "string";
        } else if (typeof value === "object") {
          if (value === null) {
            return "null";
          }
          return "object";
        } else if (typeof value === "function") {
          return "function";
        }
        return "unknown";
      }
      
      console.log(checkType(42));
      console.log(checkType("test"));
      console.log(checkType(true));
      console.log(checkType(null));
      console.log(checkType(undefined));
      console.log(checkType({}));
    `;

    await testE2E(code, "number\nstring\nboolean\nnull\nundefined\nobject\n");
  });

  it("should handle typeof with object properties", async () => {
    const code = `
      let obj = {
        num: 42,
        str: "hello",
        bool: true,
        nul: null,
        undef: undefined
      };
      
      console.log(typeof obj.num);
      console.log(typeof obj.str);
      console.log(typeof obj.bool);
      console.log(typeof obj.nul);
      console.log(typeof obj.undef);
    `;

    await testE2E(code, "number\nstring\nboolean\nobject\nundefined\n");
  });
});
