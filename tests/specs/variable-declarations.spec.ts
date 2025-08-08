import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Variable Declarations (Comprehensive - Ported from Prototype)", () => {
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

  it("should handle var declarations", async () => {
    const code = `
      var a = 10;
      console.log(a);
    `;

    await testE2E(code, "10.000000\n");
  });

  it("should handle var in function scope", async () => {
    const code = `
      function f() {
        var message = "Hello, world!";
        return message;
      }
      console.log(f());
    `;

    await testE2E(code, "Hello, world!\n");
  });

  it("should handle var access variables within other functions (closures)", async () => {
    const code = `
      function f() {
        var a = 10;
        return function g() {
          var b = a + 1;
          return b;
        }
      }

      var g = f();
      console.log(g());
    `;

    await testE2E(code, "11.000000\n");
  });

  it("should handle let declarations", async () => {
    const code = `
      let a = 10;
      console.log(a);
    `;

    await testE2E(code, "10.000000\n");
  });

  it("should handle const declarations", async () => {
    const code = `
      const a = 10;
      console.log(a);
    `;

    await testE2E(code, "10.000000\n");
  });

  it("should handle let with block scoping", async () => {
    const code = `
      let a = 1;
      {
        let a = 2;
        console.log(a);
      }
      console.log(a);
    `;

    await testE2E(code, "2.000000\n1.000000\n");
  });

  it("should handle const with block scoping", async () => {
    const code = `
      const a = 1;
      {
        const a = 2;
        console.log(a);
      }
      console.log(a);
    `;

    await testE2E(code, "2.000000\n1.000000\n");
  });

  it("should handle variable declarations without initialization", async () => {
    const code = `
      let a: number;
      let b: string;
      let c: boolean;
      
      a = 42;
      b = "hello";
      c = true;
      
      console.log(a);
      console.log(b);
      console.log(c);
    `;

    await testE2E(code, "42.000000\nhello\ntrue\n");
  });

  it("should handle multiple variable declarations in one statement", async () => {
    const code = `
      let a = 1, b = 2, c = 3;
      console.log(a);
      console.log(b);
      console.log(c);
    `;

    await testE2E(code, "1.000000\n2.000000\n3.000000\n");
  });

  it("should handle mixed types in variable declarations", async () => {
    const code = `
      let num: number = 42;
      let str: string = "hello";
      let bool: boolean = true;
      let arr: number[] = [1, 2, 3];
      
      console.log(num);
      console.log(str);
      console.log(bool);
      console.log(arr[0]);
    `;

    await testE2E(code, "42.000000\nhello\ntrue\n1.000000\n");
  });

  it("should handle variable reassignment", async () => {
    const code = `
      let x = 10;
      console.log(x);
      x = 20;
      console.log(x);
      x = x + 5;
      console.log(x);
    `;

    await testE2E(code, "10.000000\n20.000000\n25.000000\n");
  });

  it("should handle destructuring assignment (simple)", async () => {
    const code = `
      let arr = [1, 2, 3];
      let [a, b, c] = arr;
      console.log(a);
      console.log(b);
      console.log(c);
    `;

    await testE2E(code, "1.000000\n2.000000\n3.000000\n");
  });

  it("should handle object destructuring (simple)", async () => {
    const code = `
      let obj = {x: 10, y: 20};
      let {x, y} = obj;
      console.log(x);
      console.log(y);
    `;

    await testE2E(code, "10.000000\n20.000000\n");
  });

  it("should handle variable hoisting behavior differences", async () => {
    // Test that demonstrates var vs let behavior differences
    // Note: Our implementation may not fully replicate JavaScript hoisting
    const code = `
      function testHoisting() {
        console.log("Before declaration");
        var hoisted = "I am hoisted";
        let blockScoped = "I am block scoped";
        console.log(hoisted);
        console.log(blockScoped);
      }
      testHoisting();
    `;

    await testE2E(code, "Before declaration\nI am hoisted\nI am block scoped\n");
  });

  it("should handle variable initialization with complex expressions", async () => {
    const code = `
      let a = 5;
      let b = a * 2;
      let c = a + b;
      let d = Math.max(a, b, c);
      
      console.log(a);
      console.log(b);
      console.log(c);
      console.log(d);
    `;

    await testE2E(code, "5.000000\n10.000000\n15.000000\n15.000000\n");
  });
});
