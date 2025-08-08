import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Operators (Comprehensive - Ported from Prototype)", () => {
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

  describe("Arithmetic Operators", () => {
    it("should handle binary arithmetic operators with var", async () => {
      const code = `
        var x, y;
        y = 5;
        x = y + 2;
        console.log(x);
        x = y - 2;
        console.log(x);
        x = y * 2;
        console.log(x);
        x = y / 2;
        console.log(x);
        x = y % 2;
        console.log(x);
      `;

      await testE2E(code, "7.000000\n3.000000\n10.000000\n2.500000\n1.000000\n");
    });

    it("should handle binary arithmetic operators with let", async () => {
      const code = `
        let x, y;
        y = 5;
        x = y + 2;
        console.log(x);
        x = y - 2;
        console.log(x);
        x = y * 2;
        console.log(x);
        x = y / 2;
        console.log(x);
        x = y % 2;
        console.log(x);
      `;

      await testE2E(code, "7.000000\n3.000000\n10.000000\n2.500000\n1.000000\n");
    });

    it("should handle string concatenation with typed variables", async () => {
      const code = `
        let text1: string, text2: string, text3: string;
        text1 = "Good ";
        text2 = "Morning";
        text3 = text1 + text2;
        console.log(text3);
      `;

      await testE2E(code, "Good Morning\n");
    });

    it("should handle string concatenation with any type", async () => {
      const code = `
        let text1, text2, text3;
        text1 = "Good ";
        text2 = "Morning";
        text3 = text1 + text2;
        console.log(text3);
      `;

      await testE2E(code, "Good Morning\n");
    });

    it("should handle compound assignment operator (+=)", async () => {
      const code = `
        let text1: string, text2: string, text3: string;
        text1 = "Good ";
        text2 = "Morning";
        text3 = "";
        text3 += text1 + text2;
        console.log(text3);
      `;

      await testE2E(code, "Good Morning\n");
    });
  });

  describe("Bitwise Operators", () => {
    it("should handle all bitwise operators", async () => {
      const code = `
        let x;
        x = 5 & 1;
        console.log(x);
        x = 5 | 1;
        console.log(x);
        x = ~5;
        console.log(x);
        x = 5 ^ 1;
        console.log(x);
        x = 5 << 1;
        console.log(x);
        x = 5 >> 1;
        console.log(x);
      `;

      await testE2E(code, "1.000000\n5.000000\n-6.000000\n4.000000\n10.000000\n2.000000\n");
    });

    it("should handle bitwise NOT on integer", async () => {
      const code = `
        let r;
        r = ~1;
        console.log(r);
      `;

      await testE2E(code, "-2.000000\n");
    });

    it("should handle bitwise NOT on boolean", async () => {
      const code = `
        let r;
        r = ~false;
        console.log(r);
      `;

      await testE2E(code, "-1.000000\n");
    });
  });

  describe("Logical Operators", () => {
    it("should handle logical AND and OR with typed variables", async () => {
      const code = `
        let r: boolean;
        let x = 6, y = 3;
        r = x < 10 && y > 1;
        console.log(r);
        r = x === 5 || y === 5;
        console.log(r);
      `;

      await testE2E(code, "true\nfalse\n");
    });

    it("should handle logical AND and OR with return values", async () => {
      const code = `
        let r, x = 1, y = 2;
        r = x || y;
        console.log(r);
        r = x && y;
        console.log(r);
      `;

      await testE2E(code, "1.000000\n2.000000\n");
    });
  });

  describe("Comparison Operators", () => {
    it("should handle all comparison operators (basic 1)", async () => {
      const code = `
        console.log(1 > 2);
        console.log(1 >= 2);
        console.log(1 < 2);
        console.log(1 <= 2);
        console.log(2 > 1);
        console.log(2 >= 1);
        console.log(2 < 1);
        console.log(2 <= 1);
        console.log(2 > 2);
        console.log(2 >= 2);
        console.log(2 < 2);
        console.log(2 <= 2);
      `;

      await testE2E(
        code,
        "false\nfalse\ntrue\ntrue\ntrue\ntrue\nfalse\nfalse\nfalse\ntrue\nfalse\ntrue\n",
      );
    });

    it("should handle comparison operators with variables (1 vs 2)", async () => {
      const code = `
        let r: boolean;
        let x = 1, y = 2;
        r = x > y;
        console.log(r);
        r = x < y;
        console.log(r);
        r = x >= y;
        console.log(r);
        r = x <= y;
        console.log(r);
      `;

      await testE2E(code, "false\ntrue\nfalse\ntrue\n");
    });

    it("should handle comparison operators with equal values", async () => {
      const code = `
        let r: boolean;
        let x = 1, y = 1;
        r = x > y;
        console.log(r);
        r = x < y;
        console.log(r);
        r = x >= y;
        console.log(r);
        r = x <= y;
        console.log(r);
      `;

      await testE2E(code, "false\nfalse\ntrue\ntrue\n");
    });

    it("should handle comparison operators (2 vs 1)", async () => {
      const code = `
        let r: boolean;
        let x = 2, y = 1;
        r = x > y;
        console.log(r);
        r = x < y;
        console.log(r);
        r = x >= y;
        console.log(r);
        r = x <= y;
        console.log(r);
      `;

      await testE2E(code, "true\nfalse\ntrue\nfalse\n");
    });
  });

  describe("Equality Operators", () => {
    it("should handle strict equality (===) with same types", async () => {
      const code = `
        console.log(1 === 1);
        console.log('hello' === 'hello');
        console.log(true === true);
        console.log(false === false);
      `;

      await testE2E(code, "true\ntrue\ntrue\ntrue\n");
    });

    it("should handle strict equality (===) with different types", async () => {
      const code = `
        console.log(1 === '1');
        console.log(0 === false);
        console.log('' === false);
        console.log(null === undefined);
      `;

      await testE2E(code, "false\nfalse\nfalse\nfalse\n");
    });

    it("should handle strict equality (===) with NaN and zero", async () => {
      const code = `
        console.log(NaN === NaN);
        console.log(0 === -0);
      `;

      await testE2E(code, "false\ntrue\n");
    });

    it("should handle loose equality (==) with type coercion", async () => {
      const code = `
        console.log(1 == '1');
        console.log(0 == false);
        console.log('' == false);
        console.log(null == undefined);
      `;

      await testE2E(code, "true\ntrue\ntrue\ntrue\n");
    });

    it("should handle loose equality (==) with NaN", async () => {
      const code = `
        console.log(NaN == NaN);
        console.log(0 == -0);
      `;

      await testE2E(code, "false\ntrue\n");
    });

    it("should handle object reference equality", async () => {
      const code = `
        let obj1 = { a: 1 };
        let obj2 = { a: 1 };
        let obj3 = obj1;
        console.log(obj1 === obj2);
        console.log(obj1 === obj3);
        console.log(obj1 == obj2);
        console.log(obj1 == obj3);
      `;

      await testE2E(code, "false\ntrue\nfalse\ntrue\n");
    });

    it("should handle array reference equality", async () => {
      const code = `
        let arr1 = [1, 2, 3];
        let arr2 = [1, 2, 3];
        let arr3 = arr1;
        console.log(arr1 === arr2);
        console.log(arr1 === arr3);
      `;

      await testE2E(code, "false\ntrue\n");
    });

    it("should handle not equals operators", async () => {
      const code = `
        console.log(1 !== '1');
        console.log(1 != '1');
        console.log(null !== undefined);
        console.log(null != undefined);
      `;

      await testE2E(code, "true\nfalse\ntrue\nfalse\n");
    });
  });

  describe("In Operator", () => {
    it("should handle in operator with arrays", async () => {
      const code = `
        let c = [1, 2, 3];
        let b = 2 in c;
        console.log(b);
      `;

      await testE2E(code, "true\n");
    });

    it("should handle in operator with objects", async () => {
      const code = `
        let c = {1: 2};
        let b = 1 in c;
        console.log(b);
      `;

      await testE2E(code, "true\n");
    });
  });

  describe("Assignment Operators", () => {
    it("should handle arithmetic assignment operators", async () => {
      const code = `
        let x = 10;
        console.log(x);
        x += 5;
        console.log(x);
        x -= 3;
        console.log(x);
        x *= 2;
        console.log(x);
        x /= 4;
        console.log(x);
        x %= 5;
        console.log(x);
      `;

      await testE2E(code, "10.000000\n15.000000\n12.000000\n24.000000\n6.000000\n1.000000\n");
    });

    it("should handle bitwise assignment operators", async () => {
      const code = `
        let x = 5;
        console.log(x);
        x &= 3;
        console.log(x);
        x |= 2;
        console.log(x);
        x ^= 7;
        console.log(x);
        x <<= 1;
        console.log(x);
        x >>= 2;
        console.log(x);
      `;

      await testE2E(code, "5.000000\n1.000000\n3.000000\n4.000000\n8.000000\n2.000000\n");
    });
  });

  describe("Unary Operators", () => {
    it("should handle unary plus and minus", async () => {
      const code = `
        let x = 5;
        console.log(+x);
        console.log(-x);
        let y = -10;
        console.log(+y);
        console.log(-y);
      `;

      await testE2E(code, "5.000000\n-5.000000\n-10.000000\n10.000000\n");
    });

    it("should handle logical NOT operator", async () => {
      const code = `
        console.log(!true);
        console.log(!false);
        console.log(!0);
        console.log(!1);
        console.log(!"");
        console.log(!"hello");
      `;

      await testE2E(code, "false\ntrue\ntrue\nfalse\ntrue\nfalse\n");
    });

    it("should handle increment and decrement operators", async () => {
      const code = `
        let x = 5;
        console.log(x++);
        console.log(x);
        console.log(++x);
        console.log(x);
        console.log(x--);
        console.log(x);
        console.log(--x);
        console.log(x);
      `;

      await testE2E(
        code,
        "5.000000\n6.000000\n7.000000\n7.000000\n7.000000\n6.000000\n5.000000\n5.000000\n",
      );
    });
  });

  describe("Typeof Operator", () => {
    it("should handle typeof operator with different types", async () => {
      const code = `
        console.log(typeof 42);
        console.log(typeof "hello");
        console.log(typeof true);
        console.log(typeof undefined);
        console.log(typeof null);
        console.log(typeof [1, 2, 3]);
        console.log(typeof {a: 1});
      `;

      await testE2E(code, "number\nstring\nboolean\nundefined\nobject\nobject\nobject\n");
    });
  });

  describe("Complex Operator Expressions", () => {
    it("should handle complex arithmetic expressions", async () => {
      const code = `
        let a = 2, b = 3, c = 4;
        let result = a + b * c;
        console.log(result);
        result = (a + b) * c;
        console.log(result);
        result = a * b + c;
        console.log(result);
        result = a * (b + c);
        console.log(result);
      `;

      await testE2E(code, "14.000000\n20.000000\n10.000000\n14.000000\n");
    });

    it("should handle mixed operator precedence", async () => {
      const code = `
        let result = 2 + 3 * 4 > 10 && 5 < 10;
        console.log(result);
        result = (2 + 3) * 4 > 10 && 5 < 10;
        console.log(result);
        result = 2 + 3 * 4 > 20 || 5 < 10;
        console.log(result);
      `;

      await testE2E(code, "true\ntrue\ntrue\n");
    });

    it("should handle chained comparisons", async () => {
      const code = `
        let x = 5, y = 10, z = 15;
        console.log(x < y && y < z);
        console.log(x > y || y < z);
        console.log(x === 5 && y === 10 && z === 15);
        console.log(x !== y && y !== z && x !== z);
      `;

      await testE2E(code, "true\ntrue\ntrue\ntrue\n");
    });
  });

  describe("Advanced Assignment and Increment Tests (from prototype)", () => {
    it("should handle compound assignment with return values", async () => {
      const code = `
        let x = 12;
        let result = (x += 10);
        console.log(result);
        console.log(x);
        x /= 2;
        console.log(x);
      `;

      await testE2E(code, "22.000000\n22.000000\n11.000000\n");
    });

    it("should handle string compound assignment", async () => {
      const code = `
        let s = "fo" + 1;
        let t = "ba" + 2;
        s += t;
        console.log(s);
        
        let x = "fo";
        let result = (x += "ba");
        console.log(result);
        console.log(x);
      `;

      await testE2E(code, "fo1ba2\nfoba\nfoba\n");
    });

    it("should handle increment operators with array access", async () => {
      const code = `
        let arr = [1];
        let original = arr[0];
        console.log(original);
        arr[0]++;
        console.log(arr[0]);
        
        let postIncResult = arr[0]++;
        console.log(postIncResult);
        console.log(arr[0]);
        
        let preIncResult = ++arr[0];
        console.log(preIncResult);
        console.log(arr[0]);
      `;

      await testE2E(code, "1.000000\n2.000000\n2.000000\n3.000000\n4.000000\n4.000000\n");
    });

    it("should handle shift assignment operators", async () => {
      const code = `
        let x = 14;
        console.log(x);
        x >>= 1;
        console.log(x);
        x <<= 2;
        console.log(x);
      `;

      await testE2E(code, "14.000000\n7.000000\n28.000000\n");
    });
  });
});
