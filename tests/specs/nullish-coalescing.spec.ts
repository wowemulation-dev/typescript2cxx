import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Nullish Coalescing Operator (??) - Ported from Prototype", () => {
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

  it("should use default value for null", async () => {
    const code = `
      const result = null ?? "default";
      console.log(result);
    `;

    await testE2E(code, "default\n");
  });

  it("should use default value for undefined", async () => {
    const code = `
      const result = undefined ?? "default";
      console.log(result);
    `;

    await testE2E(code, "default\n");
  });

  it("should preserve falsy values that are not nullish", async () => {
    const code = `
      console.log(0 ?? "default");
      console.log("" ?? "default");
      console.log(false ?? "default");
    `;

    await testE2E(code, "0.000000\n\nfalse\n");
  });

  it("should work with chained nullish coalescing", async () => {
    const code = `
      const result = null ?? undefined ?? "final";
      console.log(result);
    `;

    await testE2E(code, "final\n");
  });

  it("should work with variables", async () => {
    const code = `
      let input: any = null;
      const result = input ?? "backup";
      console.log(result);
      
      input = "valid";
      const result2 = input ?? "backup";
      console.log(result2);
    `;

    await testE2E(code, "backup\nvalid\n");
  });

  it("should work with different types", async () => {
    const code = `
      const num = null ?? 42;
      const str = null ?? "text";
      const bool = null ?? true;
      
      console.log(num);
      console.log(str);
      console.log(bool);
    `;

    await testE2E(code, "42.000000\ntext\ntrue\n");
  });

  it("should work with expressions as operands", async () => {
    const code = `
      let x = 10;
      let y = null;
      
      const result1 = (x + 5) ?? "default";
      console.log(result1);
      
      const result2 = (y && y.prop) ?? "fallback";
      console.log(result2);
      
      const result3 = (x > 5 ? null : x) ?? "backup";
      console.log(result3);
    `;

    await testE2E(code, "15.000000\nfallback\nbackup\n");
  });

  it("should work with object property access", async () => {
    const code = `
      let obj: any = null;
      const result1 = obj?.name ?? "unknown";
      console.log(result1);
      
      obj = { name: "John" };
      const result2 = obj?.name ?? "unknown";
      console.log(result2);
      
      obj = { name: null };
      const result3 = obj?.name ?? "unknown";
      console.log(result3);
    `;

    await testE2E(code, "unknown\nJohn\nunknown\n");
  });

  it("should have correct precedence with logical operators", async () => {
    const code = `
      let x = null;
      let y = 0;
      let z = 5;
      
      // ?? has lower precedence than &&
      const result1 = x && y ?? z;
      console.log(result1);
      
      // ?? has lower precedence than ||
      const result2 = x || y ?? z;
      console.log(result2);
      
      // Parentheses to change precedence
      const result3 = (x ?? y) && z;
      console.log(result3);
    `;

    await testE2E(code, "5.000000\n0.000000\n0.000000\n");
  });

  it("should work in assignment contexts", async () => {
    const code = `
      let config: any = null;
      let defaultPort = 8080;
      
      let port = config?.port ?? defaultPort;
      console.log(port);
      
      config = { port: null };
      port = config?.port ?? defaultPort;
      console.log(port);
      
      config = { port: 3000 };
      port = config?.port ?? defaultPort;
      console.log(port);
    `;

    await testE2E(code, "8080.000000\n8080.000000\n3000.000000\n");
  });
});
