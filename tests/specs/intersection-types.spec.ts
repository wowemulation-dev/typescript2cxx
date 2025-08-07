/**
 * Tests for Intersection Type transpilation
 */
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

Deno.test("Intersection Types: interface intersection", async () => {
  const input = `
interface A {
  x: number;
}

interface B {
  y: string;
}

let combined: A & B = { x: 42, y: "hello" };
console.log(combined.x, combined.y);
`;

  const result = await transpile(input, { outputName: "test" });

  // For now, intersection types should fallback to using one of the types
  // In this case, it should pick the first interface type
  assertEquals(result.source.includes("A combined") || result.source.includes("B combined"), true);
});

Deno.test("Intersection Types: primitive & object intersection", async () => {
  const input = `
interface HasLength {
  length: number;
}

let value: string & HasLength = "hello" as string & HasLength;
console.log(value.length);
`;

  const result = await transpile(input, { outputName: "test" });

  // Should prioritize object type over primitive
  assertEquals(result.source.includes("HasLength value"), true);
});

Deno.test("Intersection Types: multiple object intersection", async () => {
  const input = `
interface X { x: number; }
interface Y { y: string; }  
interface Z { z: boolean; }

let multi: X & Y & Z = { x: 1, y: "test", z: true };
`;

  const result = await transpile(input, { outputName: "test" });

  // Should pick the first object type
  assertEquals(result.source.includes("X multi"), true);
});

Deno.test("Intersection Types: function parameter intersection", async () => {
  const input = `
interface Readable { read(): string; }
interface Writable { write(data: string): void; }

function process(io: Readable & Writable): void {
  const data = io.read();
  io.write(data);
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Function parameter should use the first interface
  assertEquals(result.source.includes("Readable io"), true);
});

Deno.test("Intersection Types: all primitives intersection", async () => {
  const input = `
let weird: number & string = 42 as number & string;
`;

  const result = await transpile(input, { outputName: "test" });

  // Should fallback to first primitive type
  assertEquals(result.source.includes("js::number weird"), true);
});