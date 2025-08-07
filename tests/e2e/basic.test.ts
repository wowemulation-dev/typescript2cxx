/**
 * End-to-end tests for basic transpilation and execution
 */
import { assertEquals } from "@std/assert";
import { CrossPlatformTestRunner } from "../../src/test-runner.ts";

// Skip these tests if no C++ compiler is available
const hasCompiler = await (async () => {
  try {
    const runner = new CrossPlatformTestRunner();
    return true;
  } catch {
    return false;
  }
})();

const testIf = hasCompiler ? Deno.test : Deno.test.ignore;

testIf("e2e: hello world", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
console.log("Hello, World!");
`;

  const result = await runner.runTest(
    tsCode,
    "Hello, World!",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: basic arithmetic", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
const a = 10;
const b = 20;
const sum = a + b;
console.log(sum);
`;

  const result = await runner.runTest(
    tsCode,
    "30",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: string operations", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
const name = "TypeScript";
const greeting = "Hello, " + name + "!";
console.log(greeting);
`;

  const result = await runner.runTest(
    tsCode,
    "Hello, TypeScript!",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: array operations", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
const numbers = [1, 2, 3, 4, 5];
let sum = 0;
for (const num of numbers) {
  sum += num;
}
console.log(sum);
`;

  const result = await runner.runTest(
    tsCode,
    "15",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: function call", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
function add(a: number, b: number): number {
  return a + b;
}

const result = add(3, 4);
console.log(result);
`;

  const result = await runner.runTest(
    tsCode,
    "7",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: class with methods", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }
}

const calc = new Calculator();
console.log(calc.add(5, 3));
console.log(calc.multiply(4, 6));
`;

  const result = await runner.runTest(
    tsCode,
    "8\n24",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: conditional logic", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
const x = 10;
if (x > 5) {
  console.log("Greater");
} else {
  console.log("Lesser");
}
`;

  const result = await runner.runTest(
    tsCode,
    "Greater",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: loops", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
for (let i = 0; i < 3; i++) {
  console.log(i);
}
`;

  const result = await runner.runTest(
    tsCode,
    "0\n1\n2",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: exception handling", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
try {
  console.log("Before");
  throw new Error("Test error");
  console.log("After");
} catch (e) {
  console.log("Caught");
}
`;

  const result = await runner.runTest(
    tsCode,
    "Before\nCaught",
    "./runtime",
  );

  assertEquals(result.success, true);
});

testIf("e2e: class inheritance", async () => {
  const runner = new CrossPlatformTestRunner();

  const tsCode = `
class Animal {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  speak(): void {
    console.log(this.name + " makes a sound");
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name);
  }
  
  speak(): void {
    console.log(this.name + " barks");
  }
}

const dog = new Dog("Rex");
dog.speak();
`;

  const result = await runner.runTest(
    tsCode,
    "Rex barks",
    "./runtime",
  );

  assertEquals(result.success, true);
});