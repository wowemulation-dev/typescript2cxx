/**
 * Tests for async/await functionality with C++20 coroutines
 */

import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

describe("Async/Await", () => {
  describe("Basic async functions", () => {
    it("should transform simple async function", async () => {
      const input = `
async function fetchData(): Promise<string> {
  return "data";
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals(
        (result.header + result.source).includes("js::Task<js::string> fetchData()"),
        true,
      );
      assertEquals((result.header + result.source).includes("co_return"), true);
      assertEquals((result.header + result.source).includes("runtime/async.h"), true);
    });

    it("should handle async function with await", async () => {
      const input = `
async function getData(): Promise<string> {
  const result = await fetchData();
  return result;
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals(
        (result.header + result.source).includes("js::Task<js::string> getData()"),
        true,
      );
      assertEquals((result.header + result.source).includes("co_await fetchData()"), true);
      assertEquals((result.header + result.source).includes("co_return result"), true);
    });

    it("should handle void async function", async () => {
      const input = `
async function processData(): Promise<void> {
  await doSomething();
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("js::Task<void> processData()"), true);
      assertEquals((result.header + result.source).includes("co_await doSomething()"), true);
    });

    it("should handle async arrow functions", async () => {
      const input = `
const fetchUser = async (id: number): Promise<User> => {
  const user = await getUserById(id);
  return user;
};
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("js::Task<User>"), true);
      assertEquals((result.header + result.source).includes("co_await getUserById(id)"), true);
      assertEquals((result.header + result.source).includes("co_return user"), true);
    });
  });

  describe("Multiple awaits", () => {
    it("should handle sequential awaits", async () => {
      const input = `
async function fetchMultiple(): Promise<void> {
  const data1 = await fetch1();
  const data2 = await fetch2();
  const data3 = await fetch3();
  console.log(data1, data2, data3);
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await fetch1()"), true);
      assertEquals((result.header + result.source).includes("co_await fetch2()"), true);
      assertEquals((result.header + result.source).includes("co_await fetch3()"), true);
    });

    it("should handle await in expressions", async () => {
      const input = `
async function calculateAsync(): Promise<number> {
  const sum = (await getValue1()) + (await getValue2());
  return sum;
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await getValue1()"), true);
      assertEquals((result.header + result.source).includes("co_await getValue2()"), true);
      assertEquals((result.header + result.source).includes("co_return sum"), true);
    });
  });

  describe("Async class methods", () => {
    it("should handle async methods in classes", async () => {
      const input = `
class DataService {
  async fetchData(): Promise<string> {
    const result = await this.getData();
    return result;
  }
  
  private async getData(): Promise<string> {
    return "data";
  }
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals(
        (result.header + result.source).includes("js::Task<js::string> fetchData()"),
        true,
      );
      assertEquals(
        (result.header + result.source).includes("js::Task<js::string> getData()"),
        true,
      );
      assertEquals((result.header + result.source).includes("co_await this->getData()"), true);
    });

    it("should handle static async methods", async () => {
      const input = `
class Utils {
  static async delay(ms: number): Promise<void> {
    await sleep(ms);
  }
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("static js::Task<void> delay"), true);
      assertEquals((result.header + result.source).includes("co_await sleep(ms)"), true);
    });
  });

  describe("Error handling", () => {
    it("should handle try-catch with async/await", async () => {
      const input = `
async function fetchWithErrorHandling(): Promise<string> {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error(error);
    return "default";
  }
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("try {"), true);
      assertEquals((result.header + result.source).includes("co_await fetchData()"), true);
      assertEquals((result.header + result.source).includes("catch"), true);
      assertEquals((result.header + result.source).includes("co_return"), true);
    });

    it("should handle finally with async", async () => {
      const input = `
async function withFinally(): Promise<void> {
  try {
    await doSomething();
  } finally {
    await cleanup();
  }
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await doSomething()"), true);
      assertEquals((result.header + result.source).includes("co_await cleanup()"), true);
    });
  });

  describe("Promise methods", () => {
    it("should handle Promise.all", async () => {
      const input = `
async function fetchAll(): Promise<void> {
  const results = await Promise.all([
    fetch1(),
    fetch2(),
    fetch3()
  ]);
  console.log(results);
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await js::Promise::all"), true);
    });

    it("should handle Promise.race", async () => {
      const input = `
async function fetchFirst(): Promise<string> {
  const result = await Promise.race([
    fetch1(),
    fetch2()
  ]);
  return result;
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await js::Promise::race"), true);
      assertEquals((result.header + result.source).includes("co_return result"), true);
    });

    it("should handle Promise.resolve and Promise.reject", async () => {
      const input = `
async function testPromiseMethods(): Promise<void> {
  const resolved = await Promise.resolve(42);
  try {
    const rejected = await Promise.reject(new Error("test"));
  } catch (e) {
    console.error(e);
  }
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await js::Promise::resolve"), true);
      assertEquals((result.header + result.source).includes("co_await js::Promise::reject"), true);
    });
  });

  describe("Async iterators", () => {
    it("should handle for-await-of loops", async () => {
      const input = `
async function processStream(): Promise<void> {
  for await (const item of asyncIterable) {
    console.log(item);
  }
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals(
        (result.header + result.source).includes("js::Task<void> processStream()"),
        true,
      );
      // Note: for-await-of requires additional implementation
    });
  });

  describe("Complex scenarios", () => {
    it("should handle nested async functions", async () => {
      const input = `
async function outer(): Promise<number> {
  const inner = async (): Promise<number> => {
    return await getValue();
  };
  
  const result = await inner();
  return result * 2;
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("js::Task<js::number>"), true);
      assertEquals((result.header + result.source).includes("co_await inner()"), true);
      assertEquals((result.header + result.source).includes("co_await getValue()"), true);
    });

    it("should handle async function expressions", async () => {
      const input = `
const processor = async function(data: string): Promise<string> {
  const processed = await processData(data);
  return processed.toUpperCase();
};
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("js::Task<js::string>"), true);
      assertEquals((result.header + result.source).includes("co_await processData"), true);
      assertEquals((result.header + result.source).includes("co_return"), true);
    });

    it("should handle async with generic types", async () => {
      const input = `
async function fetchGeneric<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  return data as T;
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("template<typename T>"), true);
      assertEquals((result.header + result.source).includes("js::Task<T> fetchGeneric"), true);
      assertEquals((result.header + result.source).includes("co_await fetch(url)"), true);
      assertEquals((result.header + result.source).includes("co_await response.json()"), true);
    });
  });

  describe("Integration with other features", () => {
    it("should work with optional chaining", async () => {
      const input = `
async function fetchOptional(): Promise<string | undefined> {
  const data = await getData();
  return data?.value?.toString();
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await getData()"), true);
      assertEquals((result.header + result.source).includes("co_return"), true);
    });

    it("should work with nullish coalescing", async () => {
      const input = `
async function fetchWithDefault(): Promise<string> {
  const data = await getData();
  return data ?? "default";
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await getData()"), true);
      assertEquals((result.header + result.source).includes("co_return"), true);
    });

    it("should work with destructuring", async () => {
      const input = `
async function fetchAndDestruct(): Promise<void> {
  const { name, age } = await getUserData();
  console.log(name, age);
}
`;

      const result = await transpile(input, { standard: "c++20" });
      assertEquals((result.header + result.source).includes("co_await getUserData()"), true);
    });
  });
});
