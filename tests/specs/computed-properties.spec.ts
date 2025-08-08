import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Computed Property Names - Ported from Prototype", () => {
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
    await runEndToEndTest(code, expectedOutput);
  }

  it("should handle string concatenation in computed property names", async () => {
    const code = `
      const f = 10;
      const o = { f, ["c" + "x"]: 12, 1: "x", [1 + 2]: "b123" };
      
      console.log(o.f);
      console.log(o.cx);
      console.log(o[1]);
      console.log(o[3]);
    `;

    await testE2E(code, "10.000000\n12.000000\nx\nb123\n");
  });

  it("should handle computed property names with variables", async () => {
    const code = `
      let key = "dynamicKey";
      let objWithComputed = {
        [key]: "value",
        regularProp: "regular"
      };
      
      console.log(objWithComputed.dynamicKey);
      console.log(objWithComputed.regularProp);
    `;

    await testE2E(code, "value\nregular\n");
  });

  it("should handle numeric expressions in computed properties", async () => {
    const code = `
      let obj = {
        [1 + 1]: "two",
        [2 * 3]: "six",
        [10 / 2]: "five"
      };
      
      console.log(obj[2]);
      console.log(obj[6]);
      console.log(obj[5]);
    `;

    await testE2E(code, "two\nsix\nfive\n");
  });

  it("should handle computed properties with function calls", async () => {
    const code = `
      function getKey(): string {
        return "computedKey";
      }
      
      let obj = {
        [getKey()]: "computed value",
        static: "static value"
      };
      
      console.log(obj.computedKey);
      console.log(obj.static);
    `;

    await testE2E(code, "computed value\nstatic value\n");
  });

  it("should handle dynamic property access with bracket notation", async () => {
    const code = `
      function updI(v: any) {
        v["foo"] = v["foo"] + 1;
        v["bar"] = v["bar"] + "a";
      }
      
      let obj = { foo: 10, bar: "test" };
      console.log(obj.foo);
      console.log(obj.bar);
      
      updI(obj);
      console.log(obj.foo);
      console.log(obj.bar);
    `;

    await testE2E(code, "10.000000\ntest\n11.000000\ntesta\n");
  });

  it("should handle dynamic property access with variable keys", async () => {
    const code = `
      function updIP(v: any, foo: string, bar: string) {
        v[foo] = v[foo] + 1;
        v[bar] = v[bar] + "a";
      }
      
      let obj = { count: 5, text: "hello" };
      console.log(obj.count);
      console.log(obj.text);
      
      updIP(obj, "count", "text");
      console.log(obj.count);
      console.log(obj.text);
    `;

    await testE2E(code, "5.000000\nhello\n6.000000\nhelloa\n");
  });

  it("should handle complex expressions in computed properties", async () => {
    const code = `
      let prefix = "item";
      let index = 2;
      let obj = {
        [prefix + "_" + index]: "computed item",
        [prefix.toUpperCase()]: "uppercase",
        ["XaX".slice(1, 2)]: "sliced"
      };
      
      console.log(obj.item_2);
      console.log(obj.ITEM);
      console.log(obj.a);
    `;

    await testE2E(code, "computed item\nuppercase\nsliced\n");
  });

  it("should handle mixed static and computed properties", async () => {
    const code = `
      let dynamicKey = "dynamic";
      let obj = {
        static: "static value",
        [dynamicKey]: "dynamic value",
        123: "numeric key",
        [4 + 5]: "computed numeric",
        "literal": "literal key"
      };
      
      console.log(obj.static);
      console.log(obj.dynamic);
      console.log(obj[123]);
      console.log(obj[9]);
      console.log(obj.literal);
    `;

    await testE2E(
      code,
      "static value\ndynamic value\nnumeric key\ncomputed numeric\nliteral key\n",
    );
  });

  it("should handle delete operations with computed properties", async () => {
    const code = `
      let obj: any = {
        a: 1,
        b: 2,
        c: "3"
      };
      
      console.log(obj.a);
      console.log(obj.b);
      
      delete obj.b;
      delete obj["a"];
      
      console.log(obj.a || "deleted");
      console.log(obj.b || "deleted");
      console.log(obj.c);
    `;

    await testE2E(code, "1.000000\n2.000000\ndeleted\ndeleted\n3\n");
  });

  it("should handle computed properties with symbol-like expressions", async () => {
    const code = `
      let keyExpression = "symbol" + "Key";
      let obj = {
        [keyExpression]: "symbol value",
        regularKey: "regular"
      };
      
      console.log(obj.symbolKey);
      console.log(obj.regularKey);
      
      // Test accessing via computed access
      console.log(obj[keyExpression]);
    `;

    await testE2E(code, "symbol value\nregular\nsymbol value\n");
  });

  it("should handle nested computed properties", async () => {
    const code = `
      let outer = "outer";
      let inner = "inner";
      
      let obj = {
        [outer]: {
          [inner]: "nested value",
          static: "static nested"
        },
        regular: "regular value"
      };
      
      console.log(obj.outer.inner);
      console.log(obj.outer.static);
      console.log(obj.regular);
    `;

    await testE2E(code, "nested value\nstatic nested\nregular value\n");
  });
});
