// Generic functions test

// Basic generic function
function identity<T>(value: T): T {
  return value;
}

// Generic function with constraints
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

// Multiple type parameters
function swap<T, U>(a: T, b: U): [U, T] {
  return [b, a];
}

// Generic function with default type parameter
function createArray<T = string>(size: number, defaultValue: T): T[] {
  return new Array(size).fill(defaultValue);
}

// Generic class with methods
class Container<T> {
  private value: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T): void {
    this.value = newValue;
  }

  transform<U>(fn: (value: T) => U): Container<U> {
    return new Container(fn(this.value));
  }
}

// Generic interface
interface Pair<T, U> {
  first: T;
  second: U;
}

function createPair<T, U>(first: T, second: U): Pair<T, U> {
  return { first, second };
}

function testGenericFunctions(): void {
  // Test basic generic function
  const stringIdentity = identity("hello");
  const numberIdentity = identity(42);
  const boolIdentity = identity(true);

  // Test constraint generic
  const strLength = getLength("hello world");
  const arrayLength = getLength([1, 2, 3, 4, 5]);

  // Test multiple parameters
  const swapped = swap(10, "hello");

  // Test default type parameter
  const stringArray = createArray(3, "default");
  const numberArray = createArray<number>(3, 0);

  // Test generic class
  const stringContainer = new Container("initial");
  const transformedContainer = stringContainer.transform((s) => s.length);

  // Test generic interface
  const pair = createPair("key", 123);

  console.log("Generic tests:", {
    stringIdentity,
    numberIdentity,
    boolIdentity,
    strLength,
    arrayLength,
    swapped,
    stringArray,
    numberArray,
    stringValue: stringContainer.getValue(),
    transformedValue: transformedContainer.getValue(),
    pair,
  });
}

testGenericFunctions();
