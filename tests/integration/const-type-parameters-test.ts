/**
 * Const type parameters test cases
 * Tests the TypeScript 5.0+ const modifier on generic type parameters
 * for improved type inference and literal type preservation
 */

// Basic function with const type parameter
function identity<const T>(value: T): T {
  return value;
}

// Function with multiple const type parameters
function pair<const T, const U>(first: T, second: U): [T, U] {
  return [first, second];
}

// Mixed const and non-const type parameters
function mixed<const T, U>(constParam: T, normalParam: U): void {
  console.log("Const param:", constParam);
  console.log("Normal param:", normalParam);
}

// Class with const type parameter method
class Container {
  store<const T>(value: T): T {
    console.log("Storing value:", value);
    return value;
  }

  process<const T, U>(constValue: T, normalValue: U): [T, U] {
    return [constValue, normalValue];
  }
}

// Generic class with const type parameter
class TypedContainer<const T> {
  private value!: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T): void {
    this.value = newValue;
  }
}

// Function with const type parameter and constraints
function processArray<const T extends string>(items: T[]): T[] {
  console.log("Processing array of", items.length, "items");
  return items.map((item) => item);
}

// Const type parameter with union constraints
function handleUnion<const T extends string | number>(value: T): T {
  console.log("Handling union value:", value);
  return value;
}

// Const type parameter with object constraints
function processObject<const T extends { id: number }>(obj: T): T {
  console.log("Processing object with ID:", obj.id);
  return obj;
}

// Complex generic function with const type parameters
function createTuple<const T, const U, const V>(a: T, b: U, c: V): [T, U, V] {
  return [a, b, c];
}

// Interface with const type parameter (in method signatures)
interface DataProcessor {
  transform<const T>(input: T): T;
  combine<const T, const U>(first: T, second: U): [T, U];
}

// Class implementing interface with const type parameters
class StringProcessor implements DataProcessor {
  transform<const T>(input: T): T {
    console.log("Transforming:", input);
    return input;
  }

  combine<const T, const U>(first: T, second: U): [T, U] {
    console.log("Combining:", first, "and", second);
    return [first, second];
  }
}

// Const type parameter with recursive types
function cloneArray<const T>(arr: readonly T[]): T[] {
  return [...arr];
}

// Const type parameter with conditional-like patterns
function getValue<const T>(input: T): T {
  return input;
}

// Main function to test all const type parameter scenarios
function main(): void {
  console.log("Const type parameters test started");

  // Test basic identity function
  const str = identity("hello");
  const num = identity(42);
  const bool = identity(true);
  console.log("Identity results:", str, num, bool);

  // Test pair function
  const stringNumberPair = pair("test", 123);
  const boolArrayPair = pair(false, [1, 2, 3]);
  console.log("Pair results:", stringNumberPair, boolArrayPair);

  // Test mixed const and non-const
  mixed("const value", "normal value");
  mixed(42, { key: "object" });

  // Test container class methods
  const container = new Container();
  const storedString = container.store("stored");
  const storedNumber = container.store(999);
  const processed = container.process("const", "normal");
  console.log("Container results:", storedString, storedNumber, processed);

  // Test typed container
  const typedStringContainer = new TypedContainer("initial");
  console.log("Typed container value:", typedStringContainer.getValue());
  typedStringContainer.setValue("updated");
  console.log("Updated typed container:", typedStringContainer.getValue());

  const typedNumberContainer = new TypedContainer(100);
  console.log("Number container:", typedNumberContainer.getValue());

  // Test constrained const type parameters
  const strings = processArray(["a", "b", "c"]);
  console.log("Processed strings:", strings);

  // Test union constraints
  const unionString = handleUnion("text");
  const unionNumber = handleUnion(456);
  console.log("Union results:", unionString, unionNumber);

  // Test object constraints
  const obj1 = processObject({ id: 1, name: "test" });
  const obj2 = processObject({ id: 2, value: 42, active: true });
  console.log("Object results:", obj1, obj2);

  // Test complex tuple creation
  const tuple = createTuple("a", 1, true);
  console.log("Created tuple:", tuple);

  // Test interface implementation
  const processor = new StringProcessor();
  const transformed = processor.transform("data");
  const combined = processor.combine("first", "second");
  console.log("Processor results:", transformed, combined);

  // Test array cloning
  const originalArray = ["x", "y", "z"] as const;
  const clonedArray = cloneArray(originalArray);
  console.log("Cloned array:", clonedArray);

  // Test generic value function
  const literalString = getValue("literal");
  const literalNumber = getValue(789);
  console.log("Value results:", literalString, literalNumber);

  console.log("Const type parameters test completed");
}

main();
