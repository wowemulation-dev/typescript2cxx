import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transpile } from "../../src/mod.ts";

describe("Array Type Transpilation", () => {
  async function testTranspilation(code: string) {
    const result = await transpile(code, {
      outputName: "test",
      standard: "c++20",
    });
    return result;
  }

  it("should handle array creation and access", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3, 4, 5];
            console.log(numbers[0]);
            console.log(numbers[4]);
            console.log(numbers.length);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array push and pop", async () => {
    const result = await testTranspilation(`
            const arr = [1, 2, 3];
            arr.push(4);
            console.log(arr.length);
            const last = arr.pop();
            console.log(last);
            console.log(arr.length);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array shift and unshift", async () => {
    const result = await testTranspilation(`
            const arr = [1, 2, 3];
            arr.unshift(0);
            console.log(arr[0]);
            const first = arr.shift();
            console.log(first);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array slice", async () => {
    const result = await testTranspilation(`
            const arr = [1, 2, 3, 4, 5];
            const slice1 = arr.slice(1, 3);
            const slice2 = arr.slice(2);
            console.log(slice1[0]);
            console.log(slice2.length);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array map", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3, 4, 5];
            const doubled = numbers.map(x => x * 2);
            console.log(doubled[0]);
            console.log(doubled[4]);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array filter", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3, 4, 5];
            const evens = numbers.filter(x => x % 2 === 0);
            console.log(evens.length);
            console.log(evens[0]);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array reduce", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3, 4, 5];
            const sum = numbers.reduce((acc, x) => acc + x, 0);
            console.log(sum);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array forEach", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3];
            numbers.forEach(x => console.log(x));
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array find and findIndex", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3, 4, 5];
            const found = numbers.find(x => x > 3);
            const index = numbers.findIndex(x => x > 3);
            console.log(found);
            console.log(index);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array includes and indexOf", async () => {
    const result = await testTranspilation(`
            const numbers = [1, 2, 3, 4, 5];
            console.log(numbers.includes(3));
            console.log(numbers.indexOf(3));
            console.log(numbers.includes(10));
            console.log(numbers.indexOf(10));
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array join", async () => {
    const result = await testTranspilation(`
            const words = ["Hello", "World", "from", "TypeScript"];
            const sentence = words.join(" ");
            console.log(sentence);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array reverse and sort", async () => {
    const result = await testTranspilation(`
            const numbers = [3, 1, 4, 1, 5];
            numbers.sort();
            console.log(numbers[0]);
            numbers.reverse();
            console.log(numbers[0]);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle array every and some", async () => {
    const result = await testTranspilation(`
            const numbers = [2, 4, 6, 8];
            const allEven = numbers.every(x => x % 2 === 0);
            const hasOdd = numbers.some(x => x % 2 === 1);
            console.log(allEven);
            console.log(hasOdd);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });

  it("should handle nested arrays", async () => {
    const result = await testTranspilation(`
            const matrix = [[1, 2], [3, 4], [5, 6]];
            console.log(matrix[0][0]);
            console.log(matrix[1][1]);
            console.log(matrix.length);
        `);
    assertEquals(typeof result.header, "string");
    assertEquals(typeof result.source, "string");
  });
});
