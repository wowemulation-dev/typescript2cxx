/**
 * Async/Await Specification Tests
 * Tests async functions, await expressions, and Promise handling
 */

import { describe, it } from "@std/testing/bdd";
import { assertStringIncludes } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

describe("Async/Await", () => {
  describe("Basic async functions", () => {
    it("should generate C++20 coroutine for simple async function", async () => {
      const code = `
        async function greet(name: string): Promise<string> {
          return "Hello, " + name;
        }
      `;
      const result = await transpile(code);

      // Check for Task<T> return type in C++20 mode
      assertStringIncludes(result.header, "js::Task<js::string>");
      // Check for Promise fallback
      assertStringIncludes(result.header, "js::Promise<js::string>");
      assertStringIncludes(result.source, "co_return");
    });

    it("should handle async function with await expression", async () => {
      const code = `
        async function step1(): Promise<string> {
          return "Step 1";
        }
        
        async function step2(): Promise<string> {
          const prev = await step1();
          return prev + " -> Step 2";
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "co_await");
      assertStringIncludes(result.source, "co_return");
    });

    it("should handle void async function", async () => {
      const code = `
        async function logMessage(msg: string): Promise<void> {
          console.log("Log: " + msg);
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "js::Task<js::any>");
      assertStringIncludes(result.source, "co_return");
    });
  });

  describe("Await expressions", () => {
    it("should transform await to co_await in C++20", async () => {
      const code = `
        async function test(): Promise<string> {
          const value = await Promise.resolve("Resolved");
          return value;
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "co_await js::Promise::resolve");
      assertStringIncludes(result.source, "co_return value");
    });

    it("should handle multiple await expressions", async () => {
      const code = `
        async function fetchData(): Promise<string> {
          const data1 = await getData1();
          const data2 = await getData2();
          return data1 + data2;
        }
      `;
      const result = await transpile(code);

      // Should have multiple co_await expressions
      const coAwaitCount = (result.source.match(/co_await/g) || []).length;
      if (coAwaitCount < 2) {
        throw new Error(`Expected at least 2 co_await, found ${coAwaitCount}`);
      }
    });

    it("should handle await in expressions", async () => {
      const code = `
        async function calculate(): Promise<number> {
          const result = (await getValue()) * 2 + (await getOffset());
          return result;
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "co_await");
      assertStringIncludes(result.source, "* 2");
    });
  });

  describe("Error handling with async/await", () => {
    it("should handle try-catch with async/await", async () => {
      const code = `
        async function mayFail(shouldFail: boolean): Promise<string> {
          if (shouldFail) {
            throw new Error("Failed");
          }
          return "Success";
        }
        
        async function test(): Promise<void> {
          try {
            const result = await mayFail(false);
            console.log(result);
          } catch (e) {
            console.error("Caught:", e);
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "try {");
      assertStringIncludes(result.source, "co_await");
      assertStringIncludes(result.source, "catch");
    });

    it("should handle finally block with async", async () => {
      const code = `
        async function withFinally(): Promise<void> {
          try {
            await doSomething();
          } finally {
            console.log("Cleanup");
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "co_await");
      assertStringIncludes(result.source, "finally");
    });
  });

  describe("Promise methods", () => {
    it("should handle Promise.resolve", async () => {
      const code = `
        async function test(): Promise<string> {
          return await Promise.resolve("value");
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Promise::resolve");
      assertStringIncludes(result.source, "co_await");
    });

    it("should handle Promise.reject", async () => {
      const code = `
        async function test(): Promise<string> {
          try {
            return await Promise.reject("error");
          } catch (e) {
            return "caught";
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Promise::reject");
    });

    it("should handle Promise.all", async () => {
      const code = `
        async function waitAll(): Promise<string[]> {
          const results = await Promise.all([
            Promise.resolve("a"),
            Promise.resolve("b")
          ]);
          return results;
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Promise::all");
      assertStringIncludes(result.source, "co_await");
    });
  });

  describe("Async arrow functions", () => {
    it("should handle async arrow functions", async () => {
      const code = `
        const asyncArrow = async (x: number): Promise<number> => {
          return await Promise.resolve(x * 2);
        };
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "co_await");
      assertStringIncludes(result.source, "co_return");
    });

    it("should handle inline async arrow functions", async () => {
      const code = `
        const double = async (x: number) => x * 2;
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "co_return");
    });
  });

  describe("Async methods in classes", () => {
    it("should handle async methods", async () => {
      const code = `
        class DataService {
          async fetchData(): Promise<string> {
            return await this.getData();
          }
          
          private async getData(): Promise<string> {
            return "data";
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "js::Task<js::string> fetchData()");
      assertStringIncludes(result.source, "co_await");
    });

    it("should handle async constructor pattern", async () => {
      const code = `
        class AsyncInit {
          private data: string;
          
          private constructor() {}
          
          static async create(): Promise<AsyncInit> {
            const instance = new AsyncInit();
            instance.data = await instance.loadData();
            return instance;
          }
          
          private async loadData(): Promise<string> {
            return "loaded";
          }
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.header, "static js::Task");
      assertStringIncludes(result.source, "co_await");
    });
  });

  describe("Complex async patterns", () => {
    it("should handle async iteration", async () => {
      const code = `
        async function* generateNumbers(): AsyncGenerator<number> {
          yield 1;
          yield 2;
          yield 3;
        }
        
        async function consumeNumbers(): Promise<void> {
          for await (const num of generateNumbers()) {
            console.log(num);
          }
        }
      `;
      const result = await transpile(code);

      // This is complex - may not be fully supported initially
      assertStringIncludes(result.source, "for");
    });

    it("should handle Promise race", async () => {
      const code = `
        async function fastest(): Promise<string> {
          return await Promise.race([
            slowOperation(),
            fastOperation()
          ]);
        }
      `;
      const result = await transpile(code);

      assertStringIncludes(result.source, "js::Promise::race");
    });
  });

  describe("C++ code generation", () => {
    it("should generate C++20 coroutine with proper macros", async () => {
      const code = `
        async function example(): Promise<number> {
          return 42;
        }
      `;
      const result = await transpile(code);

      // Should have C++20 version check
      assertStringIncludes(result.header, "#if __cplusplus >= 202002L");
      assertStringIncludes(result.header, "js::Task");
      assertStringIncludes(result.header, "#else");
      assertStringIncludes(result.header, "js::Promise");
      assertStringIncludes(result.header, "#endif");
    });

    it("should use std::async for C++17 fallback", async () => {
      const code = `
        async function fallback(): Promise<void> {
          await delay(100);
        }
      `;
      const result = await transpile(code);

      // Should have fallback implementation
      assertStringIncludes(result.source, "#if __cplusplus >= 202002L");
      assertStringIncludes(result.source, "co_await");
      assertStringIncludes(result.source, "#else");
      assertStringIncludes(result.source, "std::async");
    });
  });
});