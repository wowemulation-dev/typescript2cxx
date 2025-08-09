/**
 * Transpiler tests
 */

import { assertEquals, assertNotEquals, assertThrows as _assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../src/transpiler.ts";
import { ParseError } from "../src/errors.ts";

describe("Transpiler", () => {
  describe("Basic transpilation", () => {
    it("should transpile empty program", async () => {
      const result = await transpile("");

      assertEquals(typeof result.header, "string");
      assertEquals(typeof result.source, "string");
      assertEquals(result.warnings.length, 0);
    });

    it("should transpile hello world", async () => {
      const code = `console.log("Hello World!");`;
      const result = await transpile(code);

      assertEquals(typeof result.header, "string");
      assertEquals(typeof result.source, "string");
      // Should contain the string literal
      assertEquals(result.source.includes("Hello World!"), true);
    });

    it("should handle parse errors", async () => {
      const code = `function { invalid syntax`;

      try {
        await transpile(code);
        throw new Error("Should have thrown ParseError");
      } catch (error) {
        assertEquals(error instanceof ParseError, true);
      }
    });
  });

  describe("Variables", () => {
    it("should transpile const declaration", async () => {
      const code = `const x = 42;`;
      const result = await transpile(code);

      // TODO: Check for proper variable declaration in C++
      assertEquals(typeof result.source, "string");
    });

    it("should transpile let declaration", async () => {
      const code = `let message = "Hello";`;
      const result = await transpile(code);

      // TODO: Check for proper variable declaration in C++
      assertEquals(typeof result.source, "string");
    });
  });

  describe("Functions", () => {
    it("should transpile function declaration", async () => {
      const code = `
        function greet(name: string): string {
          return "Hello, " + name;
        }
      `;
      const result = await transpile(code);

      // TODO: Check for proper function declaration in C++
      assertEquals(typeof result.source, "string");
    });

    it("should transpile arrow function", async () => {
      const code = `const add = (a: number, b: number) => a + b;`;
      const result = await transpile(code);

      // TODO: Check for lambda in C++
      assertEquals(typeof result.source, "string");
    });
  });

  describe("Classes", () => {
    it("should transpile simple class", async () => {
      const code = `
        class Person {
          name: string;

          constructor(name: string) {
            this.name = name;
          }

          greet(): string {
            return "Hello, " + this.name;
          }
        }
      `;
      const result = await transpile(code);

      // TODO: Check for class declaration in C++
      assertEquals(typeof result.header, "string");
      assertEquals(typeof result.source, "string");
    });
  });

  describe("Memory management", () => {
    it("should handle @weak annotation", async () => {
      const code = `
        class Node {
          /** @weak */
          parent: Node;

          /** @shared */
          children: Node[] = [];
        }
      `;
      const result = await transpile(code);

      // TODO: Check for weak_ptr and shared_ptr in C++
      assertEquals(typeof result.header, "string");
    });
  });

  describe("Options", () => {
    it("should respect C++ standard option", async () => {
      const code = `const x = 1;`;
      const result = await transpile(code, { standard: "c++17" });

      assertEquals(typeof result.source, "string");
      // TODO: Check for C++17 specific features
    });

    it("should generate source maps when enabled", async () => {
      const code = `const x = 1;`;
      const result = await transpile(code, { sourceMap: true });

      // Source map generation is now implemented
      assertNotEquals(result.sourceMap, undefined);
      assertEquals(typeof result.sourceMap, "string");

      // Parse and validate source map structure
      const sourceMap = JSON.parse(result.sourceMap!);
      assertEquals(sourceMap.version, 3);
      assertEquals(sourceMap.file, "main.cpp");
      assertEquals(Array.isArray(sourceMap.sources), true);
      assertEquals(sourceMap.sources.length > 0, true);
      assertEquals(typeof sourceMap.mappings, "string");
    });
  });
});
