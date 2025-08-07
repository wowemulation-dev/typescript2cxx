/**
 * Tests for TypeScript decorator support
 */
import { assertEquals } from "@std/assert";
import { transpile } from "../../src/transpiler.ts";

Deno.test("decorators: class decorator", async () => {
  const input = `
@classDecorator
class MyClass {
  name: string = "test";
}

function classDecorator(target: any): void {
  console.log("Class decorated:", target.name);
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check that class inherits from has_metadata
  assertEquals(result.header.includes("has_metadata<MyClass>"), true);
  // Check metadata storage
  assertEquals(result.header.includes("static js::metadata_t _metadata"), true);
  // Check class decorator metadata
  assertEquals(result.source.includes('_metadata["__class_decorators__"]'), true);
});

Deno.test("decorators: method decorator", async () => {
  const input = `
class MyClass {
  @methodDecorator
  greet(): string {
    return "Hello";
  }
}

function methodDecorator(target: any, context: any): void {
  console.log("Method decorated:", context.name);
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check metadata for method
  assertEquals(result.source.includes('_metadata["greet"]'), true);
});

Deno.test("decorators: property decorator", async () => {
  const input = `
class MyClass {
  @propertyDecorator
  name: string = "test";
}

function propertyDecorator(target: any, context: any): void {
  console.log("Property decorated:", context.name);
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check metadata for property
  assertEquals(result.source.includes('_metadata["name"]'), true);
});

Deno.test("decorators: parameter decorator", async () => {
  const input = `
class MyClass {
  greet(@paramDecorator message: string): string {
    return \`Hello \${message}\`;
  }
}

function paramDecorator(target: any, context: any): void {
  console.log("Parameter decorated");
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check parameter decorator metadata
  assertEquals(
    result.source.includes('_metadata["__param_decorators__greet_0"]'),
    true,
  );
});

Deno.test("decorators: decorator factory", async () => {
  const input = `
class Product {
  @validate("required")
  @validate("email")
  email: string = "user@example.com";
  
  @range(0, 100)
  quantity: number = 10;
}

function validate(rule: string): any {
  return function (target: any, context: any): void {
    console.log("Validation rule:", rule);
  };
}

function range(min: number, max: number): any {
  return function (target: any, context: any): void {
    context.metadata[context.name] = { min, max };
  };
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check validation metadata
  assertEquals(
    result.source.includes('_metadata["__validation_email__"]'),
    true,
  );
  // Check range metadata
  assertEquals(result.source.includes('_metadata["quantity"]'), true);
});

Deno.test("decorators: multiple decorators on same target", async () => {
  const input = `
@classDecorator
@injectable
class Service {
  @propertyDecorator
  @serialize
  data: string = "value";
}

function classDecorator(target: any): void {}
function injectable(target: any): void {}
function propertyDecorator(target: any, context: any): void {}
function serialize(target: any, context: any): void {}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check multiple class decorators
  assertEquals(result.source.includes("__class_decorators__"), true);
  // Check multiple property decorators
  assertEquals(result.source.includes('_metadata["data"]'), true);
});

Deno.test("decorators: static member decorator", async () => {
  const input = `
class MyClass {
  @staticDecorator
  static staticMethod(): void {
    console.log("Static method");
  }
  
  @staticDecorator
  static staticProp: string = "static";
}

function staticDecorator(target: any, context: any): void {
  console.log("Static member decorated");
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check static member metadata
  assertEquals(result.source.includes('_metadata["staticMethod"]'), true);
  assertEquals(result.source.includes('_metadata["staticProp"]'), true);
});

Deno.test("decorators: getter/setter decorator", async () => {
  const input = `
class MyClass {
  private _value: number = 0;
  
  @accessorDecorator
  get value(): number {
    return this._value;
  }
  
  @accessorDecorator
  set value(val: number) {
    this._value = val;
  }
}

function accessorDecorator(target: any, context: any): void {
  console.log("Accessor decorated");
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check accessor metadata
  assertEquals(result.source.includes('_metadata["value"]'), true);
});

Deno.test("decorators: constructor parameter decorator", async () => {
  const input = `
@injectable
class UserService {
  constructor(
    @inject("database") private db: Database,
    @inject("logger") private logger: Logger
  ) {}
}

function injectable(target: any): void {}
function inject(token: string): any {
  return function(target: any, context: any): void {};
}
`;

  const result = await transpile(input, { outputName: "test" });

  // Check constructor parameter decorators
  assertEquals(
    result.source.includes("__param_decorators__constructor_0"),
    true,
  );
  assertEquals(
    result.source.includes("__param_decorators__constructor_1"),
    true,
  );
});

Deno.test("decorators: metadata inheritance", async () => {
  const input = `
@baseDecorator
class BaseClass {
  @propertyDecorator
  baseProp: string = "base";
}

@derivedDecorator
class DerivedClass extends BaseClass {
  @propertyDecorator
  derivedProp: string = "derived";
}

function baseDecorator(target: any): void {}
function derivedDecorator(target: any): void {}
function propertyDecorator(target: any, context: any): void {}
`;

  const result = await transpile(input, { outputName: "test" });

  // Both classes should have metadata support
  assertEquals(result.header.includes("has_metadata<BaseClass>"), true);
  assertEquals(result.header.includes("has_metadata<DerivedClass>"), true);
});