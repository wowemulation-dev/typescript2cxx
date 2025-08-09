// Test for TypeScript conditional types
// Note: Since C++ doesn't have native conditional types, we transpile to
// the resolved types at compile time

// Function with conditional return type
// In TypeScript, the return type changes based on the input type
// In C++, we generate a template or use js::any
function processValue<T>(value: T): string | number {
  if (typeof value === "string") {
    return (value as any).toUpperCase();
  }
  return 42;
}

// Type guard function
function isString(value: any): boolean {
  return typeof value === "string";
}

// Utility function similar to TypeScript's Extract
function extractString(value: string | number | boolean): string | null {
  if (typeof value === "string") {
    return value;
  }
  return null;
}

// Utility function similar to NonNullable
function removeNull<T>(value: T | null | undefined): T | undefined {
  if (value !== null && value !== undefined) {
    return value;
  }
  return undefined;
}

// Test usage
function main() {
  // Test processValue with different types
  const stringResult = processValue("hello");
  const numberResult = processValue(123);

  console.log("String result:", stringResult);
  console.log("Number result:", numberResult);

  // Test type guard
  const mixed: string | number = "test";
  if (isString(mixed)) {
    console.log("Is string:", mixed);
  }

  // Test extract utility
  const extracted = extractString("hello");
  if (extracted !== null) {
    console.log("Extracted string:", extracted);
  }

  // Test removeNull utility
  const value: string | null = "not null";
  const nonNull = removeNull(value);
  if (nonNull !== undefined) {
    console.log("Non-null value:", nonNull);
  }

  // Test with actual null
  const nullValue: string | null = null;
  const result = removeNull(nullValue);
  console.log("Result from null:", result);
}

main();
