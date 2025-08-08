import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Basic Types (Ported from Prototype)", () => {
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

  it("simple bool/null value: local", async () => {
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

  it("Basic Types", async () => {
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

    await testE2E(code, "false\n6\n61453\n10\n484\nred\n");
  });

  it("Template Strings", async () => {
    const code = `
      let fullName: string = \`Bob Bobbington\`;
      let age: number = 37;
      let sentence: string = \`Hello, my name is \${ fullName }.
I'll be \${ age + 1 } years old next month.\`;
      console.log(sentence);
    `;

    const expectedOutput = "Hello, my name is Bob Bobbington.\nI'll be 38 years old next month.\n";
    await testE2E(code, expectedOutput);
  });

  it("Array", async () => {
    const code = `
      let list: number[] = [1, 2, 3];
      console.log(list[0]);
      console.log(list[1]);
      console.log(list[2]);
      console.log(list.length);
    `;

    await testE2E(code, "1\n2\n3\n10\n");
  });

  it("Array using generic array type", async () => {
    const code = `
      let list: Array<number> = [1, 2, 3];
      console.log(list[0]);
      console.log(list[1]);
      console.log(list[2]);
      console.log(list.length);
    `;

    await testE2E(code, "1\n2\n3\n10\n");
  });

  it("Tuple", async () => {
    const code = `
      let x: [string, number];
      x = ["hello", 10];
      console.log(x[0]);
      console.log(x[1]);
    `;

    await testE2E(code, "hello\n10\n");
  });

  it("Any", async () => {
    const code = `
      let notSure: any = 4;
      console.log(notSure);
      notSure = "maybe a string instead";
      console.log(notSure);
      notSure = false;
      console.log(notSure);
    `;

    await testE2E(code, "4\nmaybe a string instead\nfalse\n");
  });

  it("Void function", async () => {
    const code = `
      function warnUser(): void {
        console.log("This is my warning message");
      }
      warnUser();
    `;

    await testE2E(code, "This is my warning message\n");
  });

  it("Undefined and null", async () => {
    const code = `
      let u: undefined = undefined;
      let n: null = null;
      console.log(u);
      console.log(n);
    `;

    await testE2E(code, "undefined\nnull\n");
  });

  it("Type assertions with angle-bracket syntax", async () => {
    const code = `
      let someValue: any = "this is a string";
      let strLength: number = (<string>someValue).length;
      console.log(strLength);
    `;

    await testE2E(code, "16\n");
  });

  it("Type assertions with as syntax", async () => {
    const code = `
      let someValue: any = "this is a string";
      let strLength: number = (someValue as string).length;
      console.log(strLength);
    `;

    await testE2E(code, "16\n");
  });
});
