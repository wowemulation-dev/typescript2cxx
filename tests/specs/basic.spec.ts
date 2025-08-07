import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/transpiler.ts";
import { existsSync } from "@std/fs";
import * as path from "@std/path";

describe("Basic TypeScript Transpilation", () => {
  const testOutputDir = "./test-output";

  // Helper to transpile and compile test code
  async function testTranspilation(code: string, expectedOutput?: string) {
    const filename = "test_" + Math.random().toString(36).substring(7);
    const inputFile = `${testOutputDir}/${filename}.ts`;
    const outputDir = `${testOutputDir}/${filename}`;

    // Create test directory
    await Deno.mkdir(testOutputDir, { recursive: true });

    // Write test TypeScript file
    await Deno.writeTextFile(inputFile, code);

    // Transpile
    const result = await transpile(inputFile, {
      outputDir,
      runtime: "embedded",
      targetCppStandard: "c++20",
    });

    // Check that files were generated
    assertEquals(result.success, true);
    assertEquals(existsSync(`${outputDir}/${filename}.cpp`), true);
    assertEquals(existsSync(`${outputDir}/${filename}.h`), true);

    // Clean up
    await Deno.remove(inputFile);
    await Deno.remove(outputDir, { recursive: true });

    return result;
  }

  it("should transpile Hello World as string const", async () => {
    const result = await testTranspilation(`
            console.log("Hello World!");
        `);
    assertEquals(result.success, true);
  });

  it("should transpile Hello World as variable", async () => {
    const result = await testTranspilation(`
            var x: string = "Hello World!";
            console.log(x);
        `);
    assertEquals(result.success, true);
  });

  it("should transpile Hello World as function", async () => {
    const result = await testTranspilation(`
            function x() {
                console.log("Hello World!");
            }
            x();
        `);
    assertEquals(result.success, true);
  });

  it("should transpile Hello World as function declaration", async () => {
    const result = await testTranspilation(`
            var x = function() {
                console.log("Hello World!");
            };
            x();
        `);
    assertEquals(result.success, true);
  });

  it("should transpile Hello World as function return", async () => {
    const result = await testTranspilation(`
            function x() {
                return "Hello World!";
            }
            console.log(x());
        `);
    assertEquals(result.success, true);
  });

  it("should transpile Hello World as arrow function", async () => {
    const result = await testTranspilation(`
            var x = () => {
                console.log("Hello World!");
            };
            x();
        `);
    assertEquals(result.success, true);
  });

  it("should transpile direct function call (IIFE)", async () => {
    const result = await testTranspilation(`
            (function() {
                console.log("Hello World!");
            })();
        `);
    assertEquals(result.success, true);
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
    assertEquals(result.success, true);
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
    assertEquals(result.success, true);
  });
});
