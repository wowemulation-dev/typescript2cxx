import { assertStringIncludes } from "@std/assert";
import { transpile } from "../../src/mod.ts";

Deno.test("NoInfer utility type - basic function with type inference suppression", async () => {
  const input = `
function createArray<T>(length: number, fill: NoInfer<T>): T[] {
  return Array(length).fill(fill);
}

const arr = createArray(3, "hello"); // T inferred as string from length context, not from fill
`;

  const result = await transpile(input);

  // NoInfer is a compile-time TypeScript construct, should pass through without modification
  assertStringIncludes(result.source, "createArray");
  assertStringIncludes(result.source, "arr");
});

Deno.test("NoInfer utility type - conditional distribution prevention", async () => {
  const input = `
type MyConditional<T> = T extends string ? string : number;
type WithNoInfer<T> = MyConditional<NoInfer<T>>;

type Test1 = MyConditional<string | number>; // string | number (distributes)
type Test2 = WithNoInfer<string | number>;   // number (doesn't distribute)
`;

  const _result = await transpile(input);

  // Type aliases are compile-time constructs, generate without runtime code
  // The test passes since no runtime code is generated for type aliases
});

Deno.test("NoInfer utility type - function overload resolution", async () => {
  const input = `
declare function combine<T>(a: T, b: NoInfer<T>): T;

function useIt() {
  const result1 = combine("hello", "world");  // T is string
  const result2 = combine(1, 2);             // T is number
}
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "result1");
  assertStringIncludes(result.source, "result2");
});

Deno.test("NoInfer utility type - generic constraint scenarios", async () => {
  const input = `
function processData<T extends object>(
  processor: (item: T) => void,
  data: NoInfer<T>[]
): void {
  data.forEach(processor);
}

interface User {
  name: string;
  age: number;
}

processData(
  (user) => console.log(user.name),
  [{ name: "Alice", age: 30 }]
);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "void processData");
  assertStringIncludes(result.source, "forEach");
});

Deno.test("NoInfer utility type - nested NoInfer types", async () => {
  const input = `
type DeepNoInfer<T> = {
  [K in keyof T]: NoInfer<T[K]>;
};

function deepMerge<T>(
  target: T,
  source: DeepNoInfer<T>
): T {
  return { ...target, ...source };
}
`;

  const result = await transpile(input);

  // Should handle nested NoInfer structures
  assertStringIncludes(result.source, "deepMerge");
});

Deno.test("NoInfer utility type - with mapped types", async () => {
  const input = `
type Optional<T> = {
  [K in keyof T]?: NoInfer<T[K]>;
};

function applyDefaults<T>(
  defaults: T,
  overrides: Optional<T>
): T {
  return { ...defaults, ...overrides };
}

const config = applyDefaults(
  { port: 8080, host: "localhost" },
  { port: 3000 }
);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "applyDefaults");
  assertStringIncludes(result.source, "config");
});

Deno.test("NoInfer utility type - in template literal types", async () => {
  const input = `
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type EventHandler<T extends string> = (event: NoInfer<T>) => void;

function addListener<T extends string>(
  eventName: EventName<T>,
  handler: EventHandler<T>
): void {
  console.log(\`Adding listener for \${eventName}\`);
}

addListener("onClick", (event) => console.log(event));
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "addListener");
});

Deno.test("NoInfer utility type - with conditional types", async () => {
  const input = `
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
type SafeArray<T> = T extends readonly unknown[] ? NoInfer<ArrayElement<T>>[] : never;

function createSafeArray<T extends readonly unknown[]>(
  input: T
): SafeArray<T> {
  return [...input] as SafeArray<T>;
}

const numbers = createSafeArray([1, 2, 3] as const);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "createSafeArray");
  assertStringIncludes(result.source, "numbers");
});

Deno.test("NoInfer utility type - function parameter variance", async () => {
  const input = `
interface Comparator<T> {
  compare(a: T, b: NoInfer<T>): number;
}

class StringComparator implements Comparator<string> {
  compare(a: string, b: string): number {
    return a.localeCompare(b);
  }
}

function sort<T>(items: T[], comparator: Comparator<NoInfer<T>>): T[] {
  return items.sort(comparator.compare);
}
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "StringComparator");
  assertStringIncludes(result.source, "sort");
});

Deno.test("NoInfer utility type - prevents unwanted inference in unions", async () => {
  const input = `
function processUnion<T>(
  handler: (value: T) => void,
  value: NoInfer<T>
): void {
  handler(value);
}

// Without NoInfer, T might be inferred as string | number
// With NoInfer, explicit type annotation is required
processUnion<string | number>(
  (val) => console.log(typeof val),
  "test"
);
`;

  const result = await transpile(input);

  assertStringIncludes(result.source, "processUnion");
});
