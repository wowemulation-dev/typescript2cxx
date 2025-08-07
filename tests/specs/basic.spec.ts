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
    await testE2E(`
            console.log("Hello World!");
        `, "Hello World!");
  });

  it("should transpile Hello World as variable", async () => {
    await testE2E(`
            var x: string = "Hello World!";
            console.log(x);
        `, "Hello World!");
  });

  it("should transpile Hello World as function", async () => {
    await testE2E(`
            function x() {
                console.log("Hello World!");
            }
            x();
        `, "Hello World!");
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
});
