import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Basic TypeScript Transpilation", () => {
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

    // Then test the full E2E pipeline (if compiler is available)
    try {
      await runEndToEndTest(code, expectedOutput, "./runtime");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("No C++ compiler found")) {
        console.warn("⚠️  Skipping E2E test: No C++ compiler found");
      } else {
        throw error;
      }
    }
  }

  it("should transpile Hello World as string const", async () => {
    await testE2E(
      `
            console.log("Hello World!");
        `,
      "Hello World!",
    );
  });

  it("should transpile Hello World as variable", async () => {
    await testE2E(
      `
            var x: string = "Hello World!";
            console.log(x);
        `,
      "Hello World!",
    );
  });

  it("should transpile Hello World as function", async () => {
    await testE2E(
      `
            function x() {
                console.log("Hello World!");
            }
            x();
        `,
      "Hello World!",
    );
  });

  it("should transpile Hello World as function declaration", async () => {
    const result = await testTranspilation(`
            var x = function() {
                console.log("Hello World!");
            };
            x();
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should transpile Hello World as function return", async () => {
    const result = await testTranspilation(`
            function x() {
                return "Hello World!";
            }
            console.log(x());
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should transpile Hello World as arrow function", async () => {
    const result = await testTranspilation(`
            var x = () => {
                console.log("Hello World!");
            };
            x();
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should transpile direct function call (IIFE)", async () => {
    const result = await testTranspilation(`
            (function() {
                console.log("Hello World!");
            })();
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle variable reassignment with different types", async () => {
    const result = await testTranspilation(`
            var x;
            x = true;
            console.log(x);
            x = 1;
            console.log(x);
            x = 1.5;
            console.log(x);
            x = "Hello World!";
            console.log(x);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle let declarations with reassignment", async () => {
    const result = await testTranspilation(`
            let x;
            x = true;
            console.log(x);
            x = 1;
            console.log(x);
            x = 1.5;
            console.log(x);
            x = "Hello World!";
            console.log(x);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  // === COMPREHENSIVE TESTS PORTED FROM PROTOTYPE ===
  // These tests are ported from the proven ASDAlexander77/TypeScript2Cxx test suite
  // to ensure compatibility and comprehensive language coverage

  it("should handle basic types with explicit typing (prototype test)", async () => {
    const code = `
      let isDone1: boolean = false;
      let decimal: number = 6;
      let hex: number = 0xf00d;
      let binary: number = 0b1010;  
      let octal: number = 0o744;
      let color: string = "blue";
      color = 'red';
      console.log(isDone1);
      console.log(decimal);
      console.log(hex);
      console.log(binary);
      console.log(octal);
      console.log(color);
    `;

    // Note: Numbers output with .000000 format in our implementation
    await testE2E(code, "false\n6.000000\n61453.000000\n10.000000\n484.000000\nred\n");
  });

  it("should handle boolean and null values with different declaration types", async () => {
    const code = `
      let isDone1: boolean = false;
      const isDone2: boolean = false;
      var isDone3: boolean = false;
      let val1: any = null;
      const val2: any = null;
      var val3: any = null;
      console.log(isDone1);
      console.log(isDone2);
      console.log(isDone3);
      console.log(val1);
      console.log(val2);
      console.log(val3);
    `;

    await testE2E(code, "false\nfalse\nfalse\nnull\nnull\nnull\n");
  });

  it("should handle array indexing and length property", async () => {
    const code = `
      let list: number[] = [1, 2, 3];
      console.log(list[0]);
      console.log(list[1]);
      console.log(list[2]);
      console.log(list.length);
    `;

    await testE2E(code, "1.000000\n2.000000\n3.000000\n3\n");
  });

  it("should handle generic Array<T> syntax", async () => {
    const code = `
      let list: Array<number> = [1, 2, 3];
      console.log(list[0]);
      console.log(list[1]);
      console.log(list[2]);
      console.log(list.length);
    `;

    await testE2E(code, "1.000000\n2.000000\n3.000000\n3\n");
  });

  it("should handle any type with dynamic reassignment", async () => {
    const code = `
      let notSure: any = 4;
      console.log(notSure);
      notSure = "maybe a string instead";
      console.log(notSure);
      notSure = false;
      console.log(notSure);
    `;

    await testE2E(code, "4.000000\nmaybe a string instead\nfalse\n");
  });

  it("should handle void function returns", async () => {
    const code = `
      function warnUser(): void {
        console.log("This is my warning message");
      }
      warnUser();
    `;

    await testE2E(code, "This is my warning message\n");
  });

  it("should handle undefined and null explicit types", async () => {
    const code = `
      let u: undefined = undefined;
      let n: null = null;
      console.log(u);
      console.log(n);
    `;

    await testE2E(code, "undefined\nnull\n");
  });
});
