// Test BigInt literals and operations
const smallBigInt = 42n;
const largeBigInt = 9007199254740991n;
const negativeBigInt = -123n;

function testBigIntOperations(): void {
  // Basic arithmetic
  const sum = 10n + 20n;
  const diff = 100n - 50n;
  const product = 6n * 7n;
  const quotient = 84n / 2n;

  // Comparison
  const isEqual = 42n === 42n;
  const isLess = 10n < 20n;
  const isGreater = 30n > 20n;

  // Mixed with numbers (should convert)
  const mixed = BigInt(123) + 456n;

  console.log("BigInt tests:", {
    smallBigInt,
    largeBigInt,
    negativeBigInt,
    sum,
    diff,
    product,
    quotient,
    isEqual,
    isLess,
    isGreater,
    mixed,
  });
}

testBigIntOperations();
