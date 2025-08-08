import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";
import { runEndToEndTest } from "../../src/test-runner.ts";

describe("Arrow Functions", () => {
  async function testTranspilation(code: string) {
    const result = await transpile(code, {
      outputName: "test",
      standard: "c++20",
    });
    return result;
  }

  async function testE2E(code: string, expectedOutput: string) {
    // First test transpilation
    const result = await testTranspilation(code);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");

    // Then test compilation and execution
    await runEndToEndTest(code, expectedOutput);
  }

  it("should handle simple arrow function", async () => {
    const code = `
      const multiply = (x: number, y: number) => x * y;
      console.log(multiply(3, 4));
    `;

    await testE2E(code, "12.000000 ");
  });

  it("should handle arrow function with block body", async () => {
    const code = `
      const add = (x: number, y: number) => {
        const result = x + y;
        return result;
      };
      console.log(add(5, 7));
    `;

    await testE2E(code, "12.000000 ");
  });

  it("should handle arrow function in array.map", async () => {
    const code = `
      const nums: number[] = [1, 2, 3];
      const doubled = nums.map((n) => n * 2);
      
      // Print each element
      for (let i = 0; i < doubled.length; i++) {
        console.log(doubled[i]);
      }
    `;

    await testE2E(code, "2.000000 \n4.000000 \n6.000000 ");
  });

  it("should handle arrow function with explicit types", async () => {
    const code = `
      const nums: number[] = [10, 20, 30];
      const halved = nums.map((n: number): number => n / 2);
      
      for (let i = 0; i < halved.length; i++) {
        console.log(halved[i]);
      }
    `;

    await testE2E(code, "5.000000 \n10.000000 \n15.000000 ");
  });

  it("should handle arrow function capturing 'this' in class", async () => {
    const code = `
      class Counter {
        private count: number = 0;
        
        increment = () => {
          this.count++;
        };
        
        getCount(): number {
          return this.count;
        }
      }
      
      const counter = new Counter();
      counter.increment();
      counter.increment();
      console.log(counter.getCount());
    `;

    await testE2E(code, "2.000000 ");
  });

  it("should handle array.filter with arrow function", async () => {
    const code = `
      const nums: number[] = [1, 2, 3, 4, 5, 6];
      const evens = nums.filter((n) => n % 2 === 0);
      
      for (let i = 0; i < evens.length; i++) {
        console.log(evens[i]);
      }
    `;

    await testE2E(code, "2.000000 \n4.000000 \n6.000000 ");
  });

  it("should handle array.reduce with arrow function", async () => {
    const code = `
      const nums: number[] = [1, 2, 3, 4];
      const sum = nums.reduce((acc, n) => acc + n, 0);
      console.log(sum);
    `;

    await testE2E(code, "10.000000 ");
  });
});
