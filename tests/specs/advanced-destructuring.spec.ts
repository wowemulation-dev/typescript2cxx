/**
 * Tests for advanced destructuring patterns
 */

import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

describe("Advanced Destructuring", () => {
  describe("Object destructuring", () => {
    it("should handle basic object destructuring", async () => {
      const input = `
const user = { name: "Alice", age: 30 };
const { name, age } = user;
console.log(name, age);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes('auto name = _temp["name"]'), true);
      assertEquals(result.source.includes('auto age = _temp["age"]'), true);
    });

    it("should handle renamed properties", async () => {
      const input = `
const user = { name: "Alice", age: 30 };
const { name: userName, age: userAge } = user;
console.log(userName, userAge);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes('auto userName = _temp["name"]'), true);
      assertEquals(result.source.includes('auto userAge = _temp["age"]'), true);
    });

    it("should handle default values", async () => {
      const input = `
const user = { name: "Alice" };
const { name, age = 25 } = user;
console.log(name, age);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes('_temp["age"]'), true);
      assertEquals(result.source.includes("js::number(25)"), true);
    });

    it("should handle nested object destructuring", async () => {
      const input = `
const user = {
  name: "Alice",
  address: {
    city: "New York",
    zip: "10001"
  }
};
const { name, address: { city, zip } } = user;
console.log(name, city, zip);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes('auto name = _temp["name"]'), true);
      assertEquals(result.source.includes('["address"]'), true);
      assertEquals(result.source.includes("city"), true);
      assertEquals(result.source.includes("zip"), true);
    });

    it("should handle rest properties", async () => {
      const input = `
const user = { name: "Alice", age: 30, city: "NYC", country: "USA" };
const { name, age, ...rest } = user;
console.log(name, age, rest);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes('auto name = _temp["name"]'), true);
      assertEquals(result.source.includes('auto age = _temp["age"]'), true);
      assertEquals(result.source.includes("rest"), true);
    });

    it("should handle computed property names", async () => {
      const input = `
const key = "name";
const user = { [key]: "Alice", age: 30 };
const { [key]: userName, age } = user;
console.log(userName, age);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("userName"), true);
      assertEquals(result.source.includes("age"), true);
    });
  });

  describe("Array destructuring", () => {
    it("should handle basic array destructuring", async () => {
      const input = `
const numbers = [1, 2, 3];
const [a, b, c] = numbers;
console.log(a, b, c);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("auto a = _temp[0]"), true);
      assertEquals(result.source.includes("auto b = _temp[1]"), true);
      assertEquals(result.source.includes("auto c = _temp[2]"), true);
    });

    it("should handle array holes", async () => {
      const input = `
const numbers = [1, 2, 3, 4];
const [a, , c] = numbers;
console.log(a, c);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("auto a = _temp[0]"), true);
      assertEquals(result.source.includes("auto c = _temp[2]"), true);
      assertEquals(result.source.includes("_temp[1]"), false); // Should skip index 1
    });

    it("should handle rest elements", async () => {
      const input = `
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
console.log(first, second, rest);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("auto first = _temp[0]"), true);
      assertEquals(result.source.includes("auto second = _temp[1]"), true);
      assertEquals(result.source.includes("rest"), true);
      assertEquals(result.source.includes("slice(2)"), true);
    });

    it("should handle nested array destructuring", async () => {
      const input = `
const matrix = [[1, 2], [3, 4]];
const [[a, b], [c, d]] = matrix;
console.log(a, b, c, d);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("_temp[0]"), true);
      assertEquals(result.source.includes("_temp[1]"), true);
      assertEquals(result.source.includes("a"), true);
      assertEquals(result.source.includes("b"), true);
      assertEquals(result.source.includes("c"), true);
      assertEquals(result.source.includes("d"), true);
    });

    it("should handle default values in arrays", async () => {
      const input = `
const numbers = [1];
const [a, b = 10] = numbers;
console.log(a, b);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("auto a = _temp[0]"), true);
      assertEquals(result.source.includes("js::number(10)"), true);
    });

    it("should handle array swapping", async () => {
      const input = `
let a = 1;
let b = 2;
[a, b] = [b, a];
console.log(a, b);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("_temp"), true);
    });
  });

  describe("Mixed destructuring", () => {
    it("should handle object with array destructuring", async () => {
      const input = `
const data = {
  user: "Alice",
  scores: [90, 85, 95]
};
const { user, scores: [first, second] } = data;
console.log(user, first, second);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("user"), true);
      assertEquals(result.source.includes("first"), true);
      assertEquals(result.source.includes("second"), true);
    });

    it("should handle array with object destructuring", async () => {
      const input = `
const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 }
];
const [{ name: firstName }, { name: secondName }] = users;
console.log(firstName, secondName);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("firstName"), true);
      assertEquals(result.source.includes("secondName"), true);
    });

    it("should handle complex nested patterns", async () => {
      const input = `
const data = {
  users: [
    { name: "Alice", details: { age: 30, city: "NYC" } },
    { name: "Bob", details: { age: 25, city: "LA" } }
  ]
};
const { users: [{ name, details: { city } }] } = data;
console.log(name, city);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("name"), true);
      assertEquals(result.source.includes("city"), true);
    });
  });

  describe("Function parameter destructuring", () => {
    it("should handle object destructuring in parameters", async () => {
      const input = `
function greet({ name, age }: { name: string; age: number }) {
  console.log(name, age);
}
greet({ name: "Alice", age: 30 });
`;

      const result = await transpile(input);
      assertEquals(result.header.includes("greet"), true);
      assertEquals(result.source.includes("name"), true);
      assertEquals(result.source.includes("age"), true);
    });

    it("should handle array destructuring in parameters", async () => {
      const input = `
function processCoords([x, y]: [number, number]) {
  console.log(x, y);
}
processCoords([10, 20]);
`;

      const result = await transpile(input);
      assertEquals(result.header.includes("processCoords"), true);
      assertEquals(result.source.includes("x"), true);
      assertEquals(result.source.includes("y"), true);
    });

    it("should handle default values in parameter destructuring", async () => {
      const input = `
function greet({ name = "Guest", age = 0 } = {}) {
  console.log(name, age);
}
greet();
`;

      const result = await transpile(input);
      assertEquals(result.source.includes('"Guest"'), true);
      assertEquals(result.source.includes("0"), true);
    });

    it("should handle rest in parameter destructuring", async () => {
      const input = `
function process({ a, b, ...rest }: any) {
  console.log(a, b, rest);
}
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("rest"), true);
    });
  });

  describe("Assignment destructuring", () => {
    it("should handle destructuring assignment to existing variables", async () => {
      const input = `
let name: string;
let age: number;
const user = { name: "Alice", age: 30 };
({ name, age } = user);
console.log(name, age);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("name ="), true);
      assertEquals(result.source.includes("age ="), true);
    });

    it("should handle destructuring in for-of loops", async () => {
      const input = `
const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 }
];
for (const { name, age } of users) {
  console.log(name, age);
}
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("for"), true);
      assertEquals(result.source.includes("name"), true);
      assertEquals(result.source.includes("age"), true);
    });

    it("should handle destructuring with type annotations", async () => {
      const input = `
const user = { name: "Alice", age: 30 };
const { name, age }: { name: string; age: number } = user;
console.log(name, age);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("name"), true);
      assertEquals(result.source.includes("age"), true);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty destructuring patterns", async () => {
      const input = `
const {} = { a: 1 };
const [] = [1, 2, 3];
`;

      const result = await transpile(input);
      // Should not crash
      assertEquals(result.source !== undefined, true);
    });

    it("should handle deeply nested patterns", async () => {
      const input = `
const data = {
  a: {
    b: {
      c: {
        d: 42
      }
    }
  }
};
const { a: { b: { c: { d } } } } = data;
console.log(d);
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("d"), true);
      assertEquals(result.source.includes("42"), false); // Value comes from data
    });

    it("should handle mixed const/let destructuring", async () => {
      const input = `
const obj = { a: 1, b: 2, c: 3 };
const { a } = obj;
let { b } = obj;
var { c } = obj;
`;

      const result = await transpile(input);
      assertEquals(result.source.includes("const"), true);
      assertEquals(result.source.includes("auto"), true);
    });
  });
});
