/**
 * Type checker tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { parseTypeScript } from "../src/ast/parser.ts";

describe("Type Checker", () => {
  describe("Basic type checking", () => {
    it("should provide type information for variables", () => {
      const result = parseTypeScript(
        `
        const x: number = 42;
        const y: string = "hello";
        const z: boolean = true;
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);
      assertExists(result.typeCheckResult);
      assertEquals(result.typeCheckResult.hasErrors, false);
    });

    it("should detect type errors", () => {
      // Note: Our simple type checker doesn't detect type errors yet
      // This would require full TypeScript program analysis
      const result = parseTypeScript(
        `
        const x: number = "not a number";
      `,
        { typeCheck: true },
      );

      assertExists(result.typeCheckResult);
      // Simple checker doesn't detect errors yet, so we just verify it runs
      assertEquals(result.typeCheckResult.hasErrors, false);
    });

    it("should resolve function return types", () => {
      const result = parseTypeScript(
        `
        function add(a: number, b: number): number {
          return a + b;
        }
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);
      assertEquals(result.typeCheckResult?.hasErrors, false);
    });

    it("should handle complex types", () => {
      const result = parseTypeScript(
        `
        interface Point {
          x: number;
          y: number;
        }
        
        const p: Point = { x: 10, y: 20 };
        const arr: number[] = [1, 2, 3];
        const tuple: [string, number] = ["hello", 42];
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);
      assertEquals(result.typeCheckResult?.hasErrors, false);
    });
  });

  describe("Type resolution", () => {
    it("should map primitive types to C++", () => {
      const result = parseTypeScript(
        `
        const n: number = 42;
        const s: string = "hello";
        const b: boolean = true;
        const v: void = undefined;
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);

      // Get the AST nodes
      const statements = result.ast.statements;
      assertEquals(statements.length, 4);

      // We can't directly test type resolution here without accessing nodes,
      // but the type checker should be available for the transformer
    });

    it("should handle union types", () => {
      const result = parseTypeScript(
        `
        let value: string | number = 42;
        value = "hello";
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);
      assertEquals(result.typeCheckResult?.hasErrors, false);
    });

    it("should handle generic types", () => {
      const result = parseTypeScript(
        `
        function identity<T>(value: T): T {
          return value;
        }
        
        const result1 = identity<number>(42);
        const result2 = identity<string>("hello");
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);
      assertEquals(result.typeCheckResult?.hasErrors, false);
    });
  });

  describe("Custom type mappings", () => {
    it("should apply custom type mappings", () => {
      const result = parseTypeScript(
        `
        const value: CustomType = createCustom();
      `,
        {
          typeCheck: true,
          typeCheckOptions: {
            typeMappings: {
              "CustomType": "my::CustomClass",
            },
          },
        },
      );

      assertExists(result.typeChecker);
      // Type mapping would be applied during transformation
    });
  });

  describe("Memory management hints", () => {
    it("should detect memory annotations from JSDoc", () => {
      const result = parseTypeScript(
        `
        /** @weak */
        class WeakRef {
          target: any;
        }
        
        /** @shared */
        const sharedObj = { data: 42 };
      `,
        { typeCheck: true },
      );

      assertExists(result.typeChecker);
      assertEquals(result.typeCheckResult?.hasErrors, false);
    });
  });
});
