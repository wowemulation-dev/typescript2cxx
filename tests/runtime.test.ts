/**
 * Runtime Library Tests for v0.3.0
 * Tests the comprehensive JavaScript runtime implementation
 */

import { describe, it } from "@std/testing/bdd";
import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { transpile } from "../src/transpiler.ts";

describe("Runtime Library v0.3.0", () => {
  describe("String Runtime", () => {
    it("should use js::string for string literals", async () => {
      const code = `const greeting = "Hello World";`;
      const result = await transpile(code);

      assertStringIncludes(result.source, 'js::string greeting = "Hello World"_S');
    });

    it("should support string concatenation", async () => {
      const code = `const message = "Hello" + " " + "World";`;
      const result = await transpile(code);

      assertStringIncludes(result.source, '"Hello"_S');
      assertStringIncludes(result.source, '"World"_S');
    });

    it("should map string methods", async () => {
      const code = `const text = "Hello".toUpperCase();`;
      const result = await transpile(code);

      // Should generate js::string method call
      assertStringIncludes(result.source, "toUpperCase");
    });

    it("should handle template literals", async () => {
      const code = 'const name = "World"; const greeting = `Hello ${name}!`;';
      const result = await transpile(code);

      assertStringIncludes(result.source, '"World"_S');
      assertStringIncludes(result.source, '"Hello "');
    });
  });

  describe("Number Runtime", () => {
    it("should use js::number for numeric literals", async () => {
      const code = `const pi = 3.14159;`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::number(3.14159)");
    });

    it("should handle NaN values", async () => {
      const code = `const invalid = NaN;`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::number::NaN");
    });

    it("should handle Infinity values", async () => {
      const code = `const inf = Infinity;`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::number::POSITIVE_INFINITY");
    });
  });

  describe("Array Runtime", () => {
    it("should use js::array for array literals", async () => {
      const code = `const numbers = [1, 2, 3];`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::array");
      assertStringIncludes(result.source, "js::number(1)");
      assertStringIncludes(result.source, "js::number(2)");
      assertStringIncludes(result.source, "js::number(3)");
    });

    it("should support array type annotations", async () => {
      const code = `const items: string[] = ["a", "b"];`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::array");
      assertStringIncludes(result.source, '"a"_S');
      assertStringIncludes(result.source, '"b"_S');
    });
  });

  describe("Object Runtime", () => {
    it("should use js::object for object literals", async () => {
      const code = `const person = { name: "Alice", age: 30 };`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::object");
      assertStringIncludes(result.source, '"name"');
      assertStringIncludes(result.source, '"Alice"_S');
      assertStringIncludes(result.source, '"age"');
      assertStringIncludes(result.source, "js::number(30)");
    });
  });

  describe("Global Functions", () => {
    it("should map parseInt to js::parseInt", async () => {
      const code = `const num = parseInt("42");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::parseInt");
    });

    it("should map parseFloat to js::parseFloat", async () => {
      const code = `const num = parseFloat("3.14");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::parseFloat");
    });

    it("should map isNaN to js::isNaN", async () => {
      const code = `const check = isNaN(42);`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::isNaN");
    });
  });

  describe("Standard Objects", () => {
    it("should map Math to js::Math", async () => {
      const code = `const pi = Math.PI;`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Math");
    });

    it("should map Date to js::Date", async () => {
      const code = `const now = new Date();`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Date");
    });

    it("should map console to js::console", async () => {
      const code = `console.log("Hello");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::console");
    });

    it("should map JSON to js::JSON", async () => {
      const code = `const str = JSON.stringify({});`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::JSON");
    });
  });

  describe("Error Types", () => {
    it("should map Error to js::Error", async () => {
      const code = `const err = new Error("Failed");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Error");
    });

    it("should map TypeError to js::TypeError", async () => {
      const code = `const err = new TypeError("Type error");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::TypeError");
    });

    it("should map ReferenceError to js::ReferenceError", async () => {
      const code = `const err = new ReferenceError("Reference error");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::ReferenceError");
    });
  });

  describe("Type Mapping", () => {
    it("should handle union types with nullable", async () => {
      const code = `let value: string | null = null;`;
      const result = await transpile(code);

      // Should generate std::optional for nullable types
      assertStringIncludes(result.source, "null");
    });

    it("should handle Array<T> generic syntax", async () => {
      const code = `const items: Array<string> = [];`;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::array");
    });

    it("should handle Promise<T> types", async () => {
      const code = `async function test(): Promise<string> { return ""; }`;
      const result = await transpile(code);

      // Should map Promise<T> to appropriate C++ type
      assertEquals(typeof result.source, "string");
    });
  });

  describe("Memory Management", () => {
    it("should not apply smart pointers to js:: runtime types", async () => {
      const code = `const text = "hello";`;
      const result = await transpile(code);

      // Should use js:: runtime types not wrapped in smart pointers
      assertStringIncludes(result.source, '"hello"_S');
      // Should not contain smart pointer syntax like std::shared_ptr
      assert(
        !result.source.includes("std::shared_ptr"),
        "Should not use smart pointers for js:: types",
      );
    });
  });

  describe("C++ Generation Quality", () => {
    it("should generate valid C++ syntax", async () => {
      const code = `
        const greeting = "Hello";
        const name = "World";
        const message = greeting + " " + name;
        console.log(message);
      `;
      const result = await transpile(code);

      // Basic syntax checks
      assertEquals(typeof result.header, "string");
      assertEquals(typeof result.source, "string");
      assertEquals(result.header.length > 0, true);
      assertEquals(result.source.length > 0, true);

      // Should include proper headers
      assertStringIncludes(result.header, "#include");
      assertStringIncludes(result.header, "js::string");

      // Should have main function
      assertStringIncludes(result.source, "int main");
      assertStringIncludes(result.source, "return 0");
    });

    it("should generate proper C++ literals", async () => {
      const code = `
        const str = "test";
        const num = 42;
        const bool = true;
        const nothing = null;
        const undef = undefined;
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, '"test"_S');
      assertStringIncludes(result.source, "js::number(42)");
      assertStringIncludes(result.source, "true");
      assertStringIncludes(result.source, "js::null");
      assertStringIncludes(result.source, "js::undefined");
    });
  });

  describe("Runtime Include", () => {
    it("should include the runtime library", async () => {
      const code = `const x = 1;`;
      const result = await transpile(code);

      assertStringIncludes(result.header, '"runtime/core.h"');
      assertStringIncludes(result.header, "using namespace js;");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle mixed type operations", async () => {
      const code = `
        const numbers = [1, 2, 3];
        const doubled = numbers.map(x => x * 2);
        const message = "Result: " + doubled.join(", ");
        console.log(message);
      `;
      const result = await transpile(code);

      assertEquals(typeof result.source, "string");
      assertEquals(result.warnings.length, 0);
    });

    it("should handle object with mixed properties", async () => {
      const code = `
        const config = {
          name: "MyApp",
          version: 1.0,
          enabled: true,
          features: ["auth", "api"]
        };
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::object");
      assertStringIncludes(result.source, '"name"');
      assertStringIncludes(result.source, '"MyApp"_S');
      assertStringIncludes(result.source, "js::number(1)");
      assertStringIncludes(result.source, "true");
      assertStringIncludes(result.source, "js::array");
    });
  });
});
