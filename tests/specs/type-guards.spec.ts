/**
 * Tests for Type Guards and typeof operator
 */
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

Deno.test("Type Guards: typeof operator basic types", async () => {
  const input = `
console.log(typeof "hello");
console.log(typeof 42);
console.log(typeof true);
console.log(typeof undefined);
console.log(typeof null);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check typeof function calls are generated
  assertEquals(result.source.includes('js::typeof("hello"_S)'), true);
  assertEquals(result.source.includes("js::typeof(js::number(42))"), true);
  assertEquals(result.source.includes("js::typeof(true)"), true);
  assertEquals(result.source.includes("js::typeof(js::undefined)"), true);
  assertEquals(result.source.includes("js::typeof(js::null)"), true);
});

Deno.test("Type Guards: typeof with variables", async () => {
  const input = `
let value: any = "test";
console.log(typeof value);
value = 123;
console.log(typeof value);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check typeof with variable
  assertEquals(result.source.includes("js::typeof(value)"), true);
});

Deno.test("Type Guards: type checking in conditionals", async () => {
  const input = `
function process(value: any): void {
  if (typeof value === "string") {
    console.log("It's a string:", value);
  } else if (typeof value === "number") {
    console.log("It's a number:", value);
  } else {
    console.log("It's something else");
  }
}

process("hello");
process(42);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check typeof in conditionals
  assertEquals(result.source.includes('js::typeof(value) == "string"'), true);
  assertEquals(result.source.includes('js::typeof(value) == "number"'), true);
});

Deno.test("Type Guards: custom type guard function", async () => {
  const input = `
function isString(value: any): value is string {
  return typeof value === "string";
}

function isNumber(value: any): value is number {
  return typeof value === "number";
}

let test: any = "hello";
if (isString(test)) {
  console.log("String detected");
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check function generates typeof check
  assertEquals(result.source.includes('js::typeof(value) == "string"'), true);
  assertEquals(result.source.includes('js::typeof(value) == "number"'), true);
});

Deno.test("Type Guards: union type with type guards", async () => {
  const input = `
function processValue(value: string | number): void {
  if (typeof value === "string") {
    console.log("Processing string:", value.length);
  } else {
    console.log("Processing number:", value + 1);
  }
}

processValue("test");
processValue(42);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check union type parameter and typeof guard
  assertEquals(result.source.includes("js::typed::StringOrNumber value"), true);
  assertEquals(result.source.includes('js::typeof(value) == "string"'), true);
});
