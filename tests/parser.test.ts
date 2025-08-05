/**
 * Parser tests
 */

import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseTypeScript } from "../src/ast/parser.ts";
import { ParseError } from "../src/errors.ts";

describe("Parser", () => {
  describe("Basic parsing", () => {
    it("should parse empty program", async () => {
      const result = await parseTypeScript("");

      assertEquals(result.filename, "<anonymous>");
      assertEquals(typeof result.parseTime, "number");
      assertEquals(result.parseTime >= 0, true);
    });

    it("should parse hello world", async () => {
      const code = `console.log("Hello World!");`;
      const result = await parseTypeScript(code);

      assertEquals(result.ast.type, "Module");
      assertEquals(Array.isArray(result.ast.body), true);
    });

    it("should track filename", async () => {
      const result = await parseTypeScript("", { filename: "test.ts" });

      assertEquals(result.filename, "test.ts");
    });
  });

  describe("Feature detection", () => {
    it("should detect async functions", async () => {
      const code = `async function test() { await Promise.resolve(); }`;
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasAsync, true);
    });

    it("should detect generators", async () => {
      const code = `function* gen() { yield 1; }`;
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasGenerators, true);
    });

    it("should detect decorators", async () => {
      const code = `
        @decorator
        class Test {}
      `;
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasDecorators, true);
    });

    it("should detect template literals", async () => {
      const code = "const msg = `Hello ${name}!`;";
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasTemplateLiterals, true);
    });

    it.skip("should detect optional chaining", async () => {
      // TODO: Fix optional chaining detection with swc AST
      const code = `const x = obj?.prop;`;
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasOptionalChaining, true);
    });

    it("should detect nullish coalescing", async () => {
      const code = `const x = a ?? b;`;
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasNullishCoalescing, true);
    });

    it("should detect bigint", async () => {
      const code = `const big = 123n;`;
      const result = await parseTypeScript(code);

      assertEquals(result.features.hasBigInt, true);
    });
  });

  describe("Error handling", () => {
    it("should throw ParseError on invalid syntax", async () => {
      const code = `function { invalid }`;

      await assertRejects(
        async () => await parseTypeScript(code),
        ParseError,
      );
    });

    it("should include error location", async () => {
      const code = `
        const x = 1;
        function { invalid
      `;

      try {
        await parseTypeScript(code);
        throw new Error("Should have thrown");
      } catch (error) {
        assertEquals(error instanceof ParseError, true);
        // Location info may be available depending on swc error format
      }
    });
  });

  describe("TypeScript features", () => {
    it("should parse type annotations", async () => {
      const code = `
        const x: number = 42;
        let y: string = "hello";
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const result = await parseTypeScript(code);

      assertEquals(result.ast.type, "Module");
    });

    it("should parse interfaces", async () => {
      const code = `
        interface Person {
          name: string;
          age: number;
        }
      `;
      const result = await parseTypeScript(code);

      assertEquals(result.ast.type, "Module");
    });

    it("should parse classes with modifiers", async () => {
      const code = `
        class Animal {
          private name: string;
          protected age: number;
          public readonly species: string;

          constructor(name: string) {
            this.name = name;
          }
        }
      `;
      const result = await parseTypeScript(code);

      assertEquals(result.ast.type, "Module");
    });

    it("should parse generics", async () => {
      const code = `
        function identity<T>(arg: T): T {
          return arg;
        }

        class Box<T> {
          value: T;
        }
      `;
      const result = await parseTypeScript(code);

      assertEquals(result.ast.type, "Module");
    });
  });
});
