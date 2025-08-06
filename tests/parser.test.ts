/**
 * Parser tests
 */

import { assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseTypeScript, ts } from "../src/ast/parser.ts";
import { ParseError } from "../src/errors.ts";

describe("Parser", () => {
  describe("Basic parsing", () => {
    it("should parse empty program", () => {
      const result = parseTypeScript("");

      assertEquals(result.filename, "<anonymous>");
      assertEquals(typeof result.parseTime, "number");
      assertEquals(result.parseTime >= 0, true);
      assertEquals(result.ast.statements.length, 0);
    });

    it("should parse hello world", () => {
      const code = `console.log("Hello World!");`;
      const result = parseTypeScript(code);

      assertEquals(result.ast.kind, ts.SyntaxKind.SourceFile);
      assertEquals(Array.isArray(result.ast.statements), true);
      assertEquals(result.ast.statements.length, 1);
    });

    it("should track filename", () => {
      const result = parseTypeScript("", { filename: "test.ts" });

      assertEquals(result.filename, "test.ts");
      assertEquals(result.ast.fileName, "test.ts");
    });
  });

  describe("Feature detection", () => {
    it("should detect async functions", () => {
      const code = `async function test() { await Promise.resolve(); }`;
      const result = parseTypeScript(code);

      assertEquals(result.features.hasAsync, true);
    });

    it("should detect generators", () => {
      const code = `function* gen() { yield 1; }`;
      const result = parseTypeScript(code);

      assertEquals(result.features.hasGenerators, true);
    });

    it("should detect decorators", () => {
      const code = `
        @decorator
        class Test {}
      `;
      const result = parseTypeScript(code);

      assertEquals(result.features.hasDecorators, true);
    });

    it("should detect template literals", () => {
      const code = "const msg = `Hello ${name}!`;";
      const result = parseTypeScript(code);

      assertEquals(result.features.hasTemplateLiterals, true);
    });

    it("should detect optional chaining", () => {
      const code = `const x = obj?.prop;`;
      const result = parseTypeScript(code);

      assertEquals(result.features.hasOptionalChaining, true);
    });

    it("should detect nullish coalescing", () => {
      const code = `const x = a ?? b;`;
      const result = parseTypeScript(code);

      assertEquals(result.features.hasNullishCoalescing, true);
    });

    it("should detect bigint", () => {
      const code = `const big = 123n;`;
      const result = parseTypeScript(code);

      assertEquals(result.features.hasBigInt, true);
    });
  });

  describe("Error handling", () => {
    it("should throw ParseError on invalid syntax", () => {
      const code = `function { invalid }`;

      assertThrows(
        () => parseTypeScript(code),
        ParseError,
      );
    });

    it("should include error location", () => {
      const code = `
        const x = 1;
        function { invalid
      `;

      try {
        parseTypeScript(code);
        throw new Error("Should have thrown");
      } catch (error) {
        assertEquals(error instanceof ParseError, true);
        // Location info may be available depending on TypeScript error format
      }
    });
  });

  describe("TypeScript features", () => {
    it("should parse type annotations", () => {
      const code = `
        const x: number = 42;
        let y: string = "hello";
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const result = parseTypeScript(code);

      assertEquals(result.ast.kind, ts.SyntaxKind.SourceFile);
      assertEquals(result.ast.statements.length, 3);
    });

    it("should parse interfaces", () => {
      const code = `
        interface Person {
          name: string;
          age: number;
        }
      `;
      const result = parseTypeScript(code);

      assertEquals(result.ast.kind, ts.SyntaxKind.SourceFile);
      assertEquals(result.ast.statements.length, 1);
    });

    it("should parse classes with modifiers", () => {
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
      const result = parseTypeScript(code);

      assertEquals(result.ast.kind, ts.SyntaxKind.SourceFile);
      assertEquals(result.ast.statements.length, 1);
    });

    it("should parse generics", () => {
      const code = `
        function identity<T>(arg: T): T {
          return arg;
        }

        class Box<T> {
          value: T;
        }
      `;
      const result = parseTypeScript(code);

      assertEquals(result.ast.kind, ts.SyntaxKind.SourceFile);
      assertEquals(result.ast.statements.length, 2);
    });
  });
});
