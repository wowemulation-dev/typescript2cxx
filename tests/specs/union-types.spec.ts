/**
 * Tests for Union Type transpilation
 */
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

Deno.test("Union Types: basic string | number union", async () => {
  const input = `
let value: string | number = "hello";
console.log(value);
value = 42;
console.log(value);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check that union type is mapped to StringOrNumber wrapper
  assertEquals(result.header.includes("js::typed::StringOrNumber"), true);
  // Check variable declaration
  assertEquals(result.source.includes("js::typed::StringOrNumber value"), true);
  // Check assignments
  assertEquals(result.source.includes('"hello"_S'), true);
  assertEquals(result.source.includes("value = js::number(42)"), true);
});

Deno.test("Union Types: nullable type T | null", async () => {
  const input = `
let nullable: string | null = null;
console.log(nullable === null ? "is null" : nullable);
nullable = "not null";
console.log(nullable);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check that nullable type is mapped to Nullable wrapper
  assertEquals(result.header.includes("js::typed::Nullable<"), true);
  // Check variable declaration
  assertEquals(result.source.includes("js::typed::Nullable<js::string> nullable"), true);
});

Deno.test("Union Types: optional type T | undefined", async () => {
  const input = `
let optional: number | undefined = undefined;
console.log(optional === undefined ? "is undefined" : optional);
optional = 123;
console.log(optional);
`;

  const result = await transpile(input, { outputName: "test" });

  // Check that optional type is mapped to Nullable wrapper
  assertEquals(result.source.includes("js::typed::Nullable<js::number> optional"), true);
});

Deno.test("Union Types: complex union fallback to js::any", async () => {
  const input = `
let complex: string | number | boolean = "test";
console.log(complex);
`;

  const result = await transpile(input, { outputName: "test" });

  // Complex unions should fallback to js::any
  assertEquals(result.source.includes("js::any complex"), true);
});

Deno.test("Union Types: union in function parameters", async () => {
  const input = `
function process(value: string | number): void {
  if (typeof value === "string") {
    console.log("String:", value);
  } else {
    console.log("Number:", value);
  }
}

process("test");
process(123);
`;

  const result = await transpile(input, { outputName: "test" });

  // Function parameter should use StringOrNumber wrapper
  assertEquals(result.source.includes("js::typed::StringOrNumber value"), true);
  // Check typeof type guard
  assertEquals(result.source.includes("typeof"), true);
});

Deno.test("Union Types: union as function return type", async () => {
  const input = `
function getValue(useString: boolean): string | number {
  if (useString) {
    return "string value";
  }
  return 999;
}

console.log(getValue(true));
console.log(getValue(false));
`;

  const result = await transpile(input, { outputName: "test" });

  // Function return type should use StringOrNumber wrapper
  assertEquals(result.source.includes("js::typed::StringOrNumber getValue"), true);
});

Deno.test("Union Types: array of union types", async () => {
  const input = `
let arr: (string | number)[] = [];
arr.push("one");
arr.push(2);
arr.push("three");
console.log(arr.length);
`;

  const result = await transpile(input, { outputName: "test" });

  // Array of union should use proper wrapper
  assertEquals(result.source.includes("js::array<js::typed::StringOrNumber>"), true);
});
