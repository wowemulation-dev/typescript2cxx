import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Logical Assignment Operators", () => {
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
    // runEndToEndTest throws on failure, no need to check result
    await runEndToEndTest(code, expectedOutput);
  }

  it("should handle &&= operator (logical AND assignment)", async () => {
    const code = `
      let a: any = true;
      let b: any = false;

      a &&= false;    // a becomes false
      b &&= true;     // b remains false (short-circuit)

      console.log(a, b);
    `;

    await testE2E(code, "false false ");
  });

  it("should handle ||= operator (logical OR assignment)", async () => {
    const code = `
      let a: any = true;
      let b: any = false;

      a ||= false;    // a remains true (short-circuit)
      b ||= true;     // b becomes true

      console.log(a, b);
    `;

    await testE2E(code, "true true ");
  });

  it("should handle ??= operator (nullish coalescing assignment)", async () => {
    const code = `
      let a: any = null;
      let b: any = undefined;
      let c: any = "";

      a ??= "replaced null";
      b ??= "replaced undefined";
      c ??= "not replaced";

      console.log(a, b, c);
    `;

    await testE2E(code, "replaced null replaced undefined  ");
  });

  it("should handle simple numeric logical assignment", async () => {
    const code = `
      let a: any = 0;
      let b: any = 5;

      a ||= 42;    // a becomes 42 (0 is falsy)
      b &&= 10;    // b becomes 10 (5 is truthy)

      console.log(a, b);
    `;

    await testE2E(code, "42.000000 10.000000 ");
  });
});
