import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/mod.ts";

describe("Module System", () => {
  describe("ES Module Imports", () => {
    it("should handle named imports", async () => {
      const source = `
import { add } from "./math";
console.log(add(2, 3));
      `;

      const result = await transpile(source, {
        outputName: "test_import_named",
      });

      // Check for C++ namespace include
      assertEquals(result.header.includes("#include \"./math.h\""), true);
      
      // Check for proper function call
      assertEquals(result.source.includes("add("), true);
    });

    it("should handle default imports", async () => {
      const source = `
import Calculator from "./calculator";
const calc = new Calculator();
console.log(calc.add(5, 3));
      `;

      const result = await transpile(source, {
        outputName: "test_import_default",
      });

      // Check for header include
      assertEquals(result.header.includes("#include \"./calculator.h\""), true);
      
      // Check for proper instantiation
      assertEquals(result.source.includes("Calculator"), true);
    });

    it("should handle namespace imports", async () => {
      const source = `
import * as utils from "./utils";
console.log(utils.formatString("hello"));
      `;

      const result = await transpile(source, {
        outputName: "test_import_namespace",
      });

      // Check for namespace usage
      assertEquals(result.source.includes("utils::"), true);
    });

    it("should handle renamed imports", async () => {
      const source = `
import { multiply as mult } from "./math";
console.log(mult(4, 5));
      `;

      const result = await transpile(source, {
        outputName: "test_import_renamed",
      });

      // Function should be called with local name
      assertEquals(result.source.includes("mult("), true);
    });

    it("should handle mixed imports", async () => {
      const source = `
import defaultExport, { namedExport, other as renamed } from "./mixed";
console.log(defaultExport.method());
console.log(namedExport());
console.log(renamed());
      `;

      const result = await transpile(source, {
        outputName: "test_import_mixed",
      });

      // Check all import types are handled
      assertEquals(result.source.includes("defaultExport"), true);
      assertEquals(result.source.includes("namedExport"), true);
      assertEquals(result.source.includes("renamed"), true);
    });
  });

  describe("ES Module Exports", () => {
    it("should handle named exports", async () => {
      const source = `
export function add(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14159;

export class Calculator {
  multiply(x: number, y: number): number {
    return x * y;
  }
}
      `;

      const result = await transpile(source, {
        outputName: "test_export_named",
      });

      // Functions and classes should be generated normally
      assertEquals(result.header.includes("js::number add("), true);
      assertEquals(result.header.includes("class Calculator"), true);
      assertEquals(result.header.includes("const js::number PI"), true);
    });

    it("should handle default exports", async () => {
      const source = `
export default class MyClass {
  getValue(): number {
    return 42;
  }
}
      `;

      const result = await transpile(source, {
        outputName: "test_export_default",
      });

      // Default export class should be generated
      assertEquals(result.header.includes("class MyClass"), true);
      assertEquals(result.header.includes("js::number getValue()"), true);
    });

    it("should handle export declarations", async () => {
      const source = `
function helper() {
  return "helper";
}

const value = 100;

export { helper, value };
      `;

      const result = await transpile(source, {
        outputName: "test_export_declarations",
      });

      // Both function and variable should be generated
      assertEquals(result.source.includes("helper()"), true);
      assertEquals(result.source.includes("value"), true);
    });

    it("should handle re-exports", async () => {
      const source = `
export { add, multiply } from "./math";
export { default as Calculator } from "./calculator";
      `;

      const result = await transpile(source, {
        outputName: "test_reexports",
      });

      // Should include the source modules
      assertEquals(result.header.includes("#include \"./math.h\""), true);
      assertEquals(result.header.includes("#include \"./calculator.h\""), true);
    });
  });

  describe("TypeScript Namespaces", () => {
    it("should handle namespace declarations", async () => {
      const source = `
namespace Math {
  export function add(a: number, b: number): number {
    return a + b;
  }
  
  export const PI = 3.14159;
}

console.log(Math.add(2, 3));
console.log(Math.PI);
      `;

      const result = await transpile(source, {
        outputName: "test_namespace",
      });

      // Should generate C++ namespace
      assertEquals(result.header.includes("namespace Math"), true);
      assertEquals(result.source.includes("Math::add"), true);
      assertEquals(result.source.includes("Math::PI"), true);
    });

    it("should handle nested namespaces", async () => {
      const source = `
namespace Outer {
  export namespace Inner {
    export function test(): string {
      return "nested";
    }
  }
}

console.log(Outer.Inner.test());
      `;

      const result = await transpile(source, {
        outputName: "test_nested_namespace",
      });

      // Should generate nested C++ namespaces
      assertEquals(result.header.includes("namespace Outer"), true);
      assertEquals(result.header.includes("namespace Inner"), true);
      assertEquals(result.source.includes("Outer::Inner::test"), true);
    });

    it("should handle module merging", async () => {
      const source = `
namespace Utils {
  export function format(s: string): string {
    return s.toUpperCase();
  }
}

namespace Utils {
  export function parse(s: string): number {
    return parseInt(s);
  }
}

console.log(Utils.format("hello"));
console.log(Utils.parse("123"));
      `;

      const result = await transpile(source, {
        outputName: "test_module_merging",
      });

      // Both functions should be in the same namespace
      assertEquals(result.header.includes("namespace Utils"), true);
      assertEquals(result.source.includes("Utils::format"), true);
      assertEquals(result.source.includes("Utils::parse"), true);
    });
  });

  describe("Module Resolution", () => {
    it("should handle relative paths", async () => {
      const source = `
import { helper } from "./utils/helper";
import { config } from "../config";
      `;

      const result = await transpile(source, {
        outputName: "test_relative_paths",
      });

      // Should convert to proper header includes
      assertEquals(result.header.includes("#include \"./utils/helper.h\""), true);
      assertEquals(result.header.includes("#include \"../config.h\""), true);
    });

    it("should handle absolute module names", async () => {
      const source = `
import { library } from "my-library";
      `;

      const result = await transpile(source, {
        outputName: "test_absolute_modules",
      });

      // Should convert to proper header include
      assertEquals(result.header.includes("#include <my-library.h>"), true);
    });
  });

  describe("Dynamic Imports", () => {
    it("should handle basic dynamic imports", async () => {
      const source = `
async function loadModule() {
  const module = await import("./dynamic-module");
  return module.default();
}
      `;

      const result = await transpile(source, {
        outputName: "test_dynamic_import",
      });

      // Dynamic imports should be converted to regular includes for C++
      assertEquals(result.header.includes("#include \"./dynamic-module.h\""), true);
    });
  });

  describe("Circular Dependencies", () => {
    it("should handle circular dependency detection", async () => {
      const source = `
import { B } from "./module-b";

export class A {
  getB(): B {
    return new B();
  }
}
      `;

      const result = await transpile(source, {
        outputName: "test_circular_deps",
      });

      // Should use forward declarations to handle circular deps
      assertEquals(result.header.includes("#include \"./module-b.h\""), true);
    });
  });
});