// Function overloading test
function processValue(value: string): string;
function processValue(value: number): number;
function processValue(value: boolean): string;
function processValue(value: string | number | boolean): string | number {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else if (typeof value === "number") {
    return value * 2;
  } else {
    return value ? "true" : "false";
  }
}

// Method overloading in class
class Calculator {
  add(a: number, b: number): number;
  add(a: string, b: string): string;
  add(a: number | string, b: number | string): number | string {
    if (typeof a === "number" && typeof b === "number") {
      return a + b;
    }
    return String(a) + String(b);
  }

  multiply(value: number): number;
  multiply(value: number, times: number): number;
  multiply(value: number, times?: number): number {
    return times ? value * times : value * value;
  }
}

function testFunctionOverloading(): void {
  // Test function overloads
  const stringResult = processValue("hello");
  const numberResult = processValue(42);
  const boolResult = processValue(true);

  // Test method overloads
  const calc = new Calculator();
  const numSum = calc.add(10, 20);
  const strSum = calc.add("hello", "world");
  const square = calc.multiply(5);
  const product = calc.multiply(5, 3);

  console.log("Overloading tests:", {
    stringResult,
    numberResult,
    boolResult,
    numSum,
    strSum,
    square,
    product,
  });
}

testFunctionOverloading();
