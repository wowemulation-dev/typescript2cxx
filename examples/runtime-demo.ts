/**
 * Runtime Library Demo - TypeScript v0.3.0
 * Demonstrates comprehensive JavaScript runtime features in C++
 */

// String operations
const greeting = "Hello, World!";
const name = "TypeScript2Cxx";
const message = greeting + " from " + name;
console.log(message);

// Number operations
const pi = 3.14159;
const radius = 5;
const area = pi * radius * radius;
console.log("Circle area:", area);

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((x) => x * 2);
const sum = numbers.reduce((acc, val) => acc + val, 0);
console.log("Numbers:", numbers.join(", "));
console.log("Doubled:", doubled.join(", "));
console.log("Sum:", sum);

// String methods
const text = "  TypeScript to C++ Transpiler  ";
console.log("Original:", text);
console.log("Trimmed:", text.trim());
console.log("Uppercase:", text.toUpperCase());
console.log("Length:", text.length);
console.log("Includes 'C++':", text.includes("C++"));

// Array methods
const fruits = ["apple", "banana", "cherry"];
fruits.push("date");
console.log("Fruits:", fruits.join(", "));

const longFruits = fruits.filter((fruit) => fruit.length > 5);
console.log("Long fruits:", longFruits.join(", "));

// Math operations
console.log("Math.PI:", Math.PI);
console.log("Math.random():", Math.random());
console.log("Math.abs(-42):", Math.abs(-42));
console.log("Math.max(1, 5, 3):", Math.max([1, 5, 3]));

// Object operations
const person = {
  name: "Alice",
  age: 30,
  city: "New York",
};

console.log("Person name:", person.name);
console.log("Person age:", person.age);

// Type conversion
const numStr = "123";
const parsed = parseInt(numStr);
console.log("Parsed number:", parsed);

// Boolean operations
const isReady = true;
const isComplete = false;
console.log("Ready AND Complete:", isReady && isComplete);
console.log("Ready OR Complete:", isReady || isComplete);

// Template literals
const version = "0.3.0";
const info = `TypeScript2Cxx v${version} - Production Ready!`;
console.log(info);

// Date operations
const now = new Date();
console.log("Current time:", now.toString());
console.log("Year:", now.getFullYear());

// Error handling
try {
  throw new Error("Demo error");
} catch (error) {
  console.error("Caught error:", error.message);
}
