// Simple debug test for non-null assertion
function testSimple(value: string | null): number {
  // Test without non-null assertion first
  const valueLength = value ? value.length : 0;
  return valueLength;
}

function testNonNull(value: string | null): number {
  // Test with non-null assertion
  return value!.length;
}

function main(): void {
  const _test1 = testSimple("hello");
  const _test2 = testNonNull("world");
}

main();
