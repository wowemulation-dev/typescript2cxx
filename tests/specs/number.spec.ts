import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/transpiler.ts";

describe("Number Type Transpilation", () => {
  const testOutputDir = "./test-output";

  async function testTranspilation(code: string) {
    const filename = "test_" + Math.random().toString(36).substring(7);
    const inputFile = `${testOutputDir}/${filename}.ts`;
    const outputDir = `${testOutputDir}/${filename}`;

    await Deno.mkdir(testOutputDir, { recursive: true });
    await Deno.writeTextFile(inputFile, code);

    const result = await transpile(inputFile, {
      outputDir,
      runtime: "embedded",
      targetCppStandard: "c++20",
    });

    await Deno.remove(inputFile);
    await Deno.remove(outputDir, { recursive: true });

    return result;
  }

  it("should handle number undefined comparisons", async () => {
    const result = await testTranspilation(`
            let a: number;
            console.log(a == undefined);
            a = 1;
            console.log(a != undefined);
            console.log(!!a);
            a = 0;
            console.log(a != undefined);
            console.log(!!a);
        `);
    assertEquals(result.success, true);
  });

  it("should handle any type with numbers", async () => {
    const result = await testTranspilation(`
            let a: any;
            console.log(a == undefined);
            a = 1;
            console.log(a != undefined);
            console.log(!!a);
            a = 0;
            console.log(a != undefined);
            console.log(!!a);
        `);
    assertEquals(result.success, true);
  });

  it("should handle strict equality with numbers", async () => {
    const result = await testTranspilation(`
            let a: number;
            console.log(a === undefined);
            a = 1;
            console.log(a !== undefined);
            console.log(!!a);
            a = 0;
            console.log(a !== undefined);
            console.log(!!a);
        `);
    assertEquals(result.success, true);
  });

  it("should handle number operations with undefined", async () => {
    const result = await testTranspilation(`
            let a: number;
            console.log(a > undefined);
            console.log(a + 1);
            a = undefined;
            a += 1;
            console.log(a);
        `);
    assertEquals(result.success, true);
  });

  it("should handle NaN and Infinity", async () => {
    const result = await testTranspilation(`
            console.log(NaN);
            console.log(Infinity);
            console.log(-Infinity);
            console.log(isNaN(NaN));
            console.log(isFinite(Infinity));
        `);
    assertEquals(result.success, true);
  });

  it("should handle number arithmetic", async () => {
    const result = await testTranspilation(`
            const a = 10;
            const b = 3;
            console.log(a + b);
            console.log(a - b);
            console.log(a * b);
            console.log(a / b);
            console.log(a % b);
        `);
    assertEquals(result.success, true);
  });

  it("should handle Math operations", async () => {
    const result = await testTranspilation(`
            console.log(Math.PI);
            console.log(Math.E);
            console.log(Math.abs(-42));
            console.log(Math.sqrt(16));
            console.log(Math.pow(2, 3));
            console.log(Math.sin(0));
            console.log(Math.cos(0));
        `);
    assertEquals(result.success, true);
  });
});

