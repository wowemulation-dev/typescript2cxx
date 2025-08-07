/**
 * Exception Handling Specification Tests
 * Tests try/catch/finally, throw statements, and error types
 */

import { describe, it } from "@std/testing/bdd";
import { assertStringIncludes } from "@std/assert";
import { transpile } from "../../src/mod.ts";

describe("Exception Handling", () => {
  describe("Basic try/catch", () => {
    it("should generate C++ try/catch block", async () => {
      const code = `
        try {
          const x = 1;
        } catch (e) {
          console.log("Error");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "catch (const js::any& e) {");
      assertStringIncludes(result.source, "js::console.log");
    });

    it("should handle typed catch parameter", async () => {
      const code = `
        try {
          throw new Error("test");
        } catch (e: Error) {
          console.log(e.message);
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, 'throw js::any(js::Error("test"_S));');
      assertStringIncludes(result.source, "catch (const js::any& e) {");
    });

    it("should handle catch without parameter", async () => {
      const code = `
        try {
          const x = 1;
        } catch {
          console.log("Error occurred");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "catch (const js::any& e) {");
    });
  });

  describe("try/catch/finally", () => {
    it("should generate try/catch/finally block", async () => {
      const code = `
        try {
          const x = 1;
        } catch (e) {
          console.error("Caught:", e);
        } finally {
          console.log("Cleanup");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "catch (const js::any& e) {");
      assertStringIncludes(result.source, "/* finally */");
      assertStringIncludes(result.source, 'js::console.log("Cleanup"_S)');
    });

    it("should handle try/finally without catch", async () => {
      const code = `
        try {
          const x = 1;
        } finally {
          console.log("Always runs");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "/* finally */");
      assertStringIncludes(result.source, 'js::console.log("Always runs"_S)');
    });
  });

  describe("Throw statements", () => {
    it("should generate throw statement with Error object", async () => {
      const code = `throw new Error("Something went wrong");`;
      const result = await transpile(code);

      assertStringIncludes(result.source, 'throw js::any(js::Error("Something went wrong"_S));');
    });

    it("should generate throw statement with string", async () => {
      const code = `throw "Error message";`;
      const result = await transpile(code);

      assertStringIncludes(result.source, 'throw js::any("Error message"_S);');
    });

    it("should generate throw statement with variable", async () => {
      const code = `
        const error = new TypeError("Type error");
        throw error;
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::TypeError> error");
      assertStringIncludes(result.source, "throw js::any(error);");
    });
  });

  describe("Error types", () => {
    it("should handle different error types in catch", async () => {
      const code = `
        try {
          throw new TypeError("Type error");
        } catch (e: TypeError) {
          console.log("Caught TypeError");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, 'throw js::any(js::TypeError("Type error"_S));');
      assertStringIncludes(result.source, "catch (const js::any& e) {");
    });

    it("should handle ReferenceError", async () => {
      const code = `
        try {
          throw new ReferenceError("Reference error");
        } catch (e: ReferenceError) {
          console.log("Caught ReferenceError");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(
        result.source,
        'throw js::any(js::ReferenceError("Reference error"_S));',
      );
      assertStringIncludes(result.source, "catch (const js::any& e) {");
    });
  });

  describe("Nested try/catch", () => {
    it("should handle nested try/catch blocks", async () => {
      const code = `
        try {
          try {
            throw new Error("Inner error");
          } catch (inner) {
            console.log("Inner catch");
            throw new Error("Outer error");
          }
        } catch (outer) {
          console.log("Outer catch");
        }
      `;
      const result = await transpile(code);

      // Should contain nested try/catch structure
      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "catch (const js::any& inner) {");
      assertStringIncludes(result.source, "catch (const js::any& outer) {");
      assertStringIncludes(result.source, 'throw js::any(js::Error("Inner error"_S));');
      assertStringIncludes(result.source, 'throw js::any(js::Error("Outer error"_S));');
    });
  });

  describe("Error properties", () => {
    it("should access error message property", async () => {
      const code = `
        try {
          throw new Error("Test message");
        } catch (e) {
          console.log(e.message);
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "catch (const js::any& e) {");
      assertStringIncludes(result.source, "e.message");
    });
  });

  describe("C++ compatibility", () => {
    it("should generate valid C++ exception handling syntax", async () => {
      const code = `
        function riskyOperation(): string {
          try {
            const result = "success";
            return result;
          } catch (e) {
            throw new Error("Operation failed");
          } finally {
            console.log("Cleanup");
          }
        }
      `;
      const result = await transpile(code);

      // Should generate valid C++ function with exception handling
      assertStringIncludes(result.source, "anonymous()");
      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "return result;");
      assertStringIncludes(result.source, "catch (const js::any& e) {");
      assertStringIncludes(result.source, 'throw js::any(js::Error("Operation failed"_S));');
      assertStringIncludes(result.source, "/* finally */");
    });

    it("should properly scope variables in try/catch blocks", async () => {
      const code = `
        let result: string;
        try {
          result = "success";
        } catch (e) {
          result = "failure";
        }
        console.log(result);
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::string result");
      assertStringIncludes(result.source, 'result = "success"_S;');
      assertStringIncludes(result.source, 'result = "failure"_S;');
      assertStringIncludes(result.source, "js::console.log(result)");
    });
  });
});
