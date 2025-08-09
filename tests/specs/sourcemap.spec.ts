import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertNotEquals } from "@std/assert";
import { transpile } from "../../src/mod.ts";

describe("Source Maps", () => {
  describe("Source Map Generation", () => {
    it("should generate source maps when enabled", async () => {
      const input = `
const x = 42;
const y = "hello world";

function greet(name: string): string {
  return "Hello, " + name + "!";
}

console.log(greet("TypeScript"));
`;

      const result = await transpile(input, {
        outputName: "test",
        sourceMap: true,
        filename: "test.ts",
      });

      // Source map should be generated
      assertNotEquals(result.sourceMap, undefined);
      assertEquals(typeof result.sourceMap, "string");

      // Parse the source map
      const sourceMapObj = JSON.parse(result.sourceMap!);

      // Check source map structure
      assertEquals(sourceMapObj.version, 3);
      assertEquals(sourceMapObj.file, "test.cpp");
      assertEquals(Array.isArray(sourceMapObj.sources), true);
      assertEquals(sourceMapObj.sources.includes("test.ts"), true);
      assertEquals(typeof sourceMapObj.mappings, "string");
      assertEquals(sourceMapObj.mappings.length > 0, true);
    });

    it("should not generate source maps when disabled", async () => {
      const input = `const x = 42;`;

      const result = await transpile(input, {
        outputName: "test",
        sourceMap: false,
      });

      assertEquals(result.sourceMap, undefined);
    });

    it("should include original source content in source map", async () => {
      const input = `
const message = "Hello, Source Maps!";
console.log(message);
`;

      const result = await transpile(input, {
        outputName: "sourcemap_test",
        sourceMap: true,
        filename: "sourcemap_test.ts",
      });

      assertNotEquals(result.sourceMap, undefined);

      const sourceMapObj = JSON.parse(result.sourceMap!);

      // Check if sourcesContent is included
      assertEquals(Array.isArray(sourceMapObj.sourcesContent), true);
      assertEquals(sourceMapObj.sourcesContent.length > 0, true);
      assertEquals(sourceMapObj.sourcesContent[0].includes("Hello, Source Maps!"), true);
    });

    it("should have correct source mapping structure", async () => {
      const input = `
let a = 1;
let b = 2;
let c = a + b;
console.log(c);
`;

      const result = await transpile(input, {
        outputName: "mapping_test",
        sourceMap: true,
        filename: "mapping_test.ts",
      });

      assertNotEquals(result.sourceMap, undefined);

      const sourceMapObj = JSON.parse(result.sourceMap!);

      // Verify basic source map properties
      assertEquals(sourceMapObj.version, 3);
      assertEquals(sourceMapObj.file, "mapping_test.cpp");
      assertEquals(sourceMapObj.sources.length, 1);
      assertEquals(sourceMapObj.sources[0], "mapping_test.ts");
      assertEquals(Array.isArray(sourceMapObj.names), true);

      // Mappings should exist
      assertEquals(typeof sourceMapObj.mappings, "string");
      assertEquals(sourceMapObj.mappings.length > 0, true);
    });

    it("should handle complex TypeScript features in source maps", async () => {
      const input = `
class Calculator {
  constructor(private name: string) {}
  
  add(a: number, b: number): number {
    return a + b;
  }
  
  getName(): string {
    return this.name;
  }
}

const calc = new Calculator("MyCalc");
console.log(calc.add(5, 3));
console.log(calc.getName());
`;

      const result = await transpile(input, {
        outputName: "complex_test",
        sourceMap: true,
        filename: "complex_test.ts",
      });

      assertNotEquals(result.sourceMap, undefined);

      const sourceMapObj = JSON.parse(result.sourceMap!);

      // Verify source map contains the complex code
      assertEquals(sourceMapObj.sources[0], "complex_test.ts");
      assertEquals(sourceMapObj.sourcesContent[0].includes("class Calculator"), true);
      assertEquals(sourceMapObj.sourcesContent[0].includes("constructor"), true);

      // Should have mappings for the complex structure
      assertEquals(sourceMapObj.mappings.length > 10, true); // Should have substantial mappings
    });
  });

  describe("Source Map Utility Functions", () => {
    it("should create valid Base64 VLQ mappings", async () => {
      const input = `const simple = "test";`;

      const result = await transpile(input, {
        outputName: "vlq_test",
        sourceMap: true,
        filename: "vlq_test.ts",
      });

      assertNotEquals(result.sourceMap, undefined);

      const sourceMapObj = JSON.parse(result.sourceMap!);

      // Mappings should be valid Base64 VLQ format
      // Basic validation - should contain valid Base64 characters and semicolons
      const validChars = /^[A-Za-z0-9+/;,]*$/;
      assertEquals(validChars.test(sourceMapObj.mappings), true);
    });
  });
});
