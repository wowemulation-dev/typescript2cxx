interface Person {
  name: string;
  age: number;
  email: string;
}

// keyof Person should resolve to "name" | "age" | "email"
type PersonKeys = keyof Person;

// Function that accepts only valid keys of Person
function getProperty(person: Person, key: PersonKeys): any {
  return person[key];
}

// Using keyof with generic constraints
function getKeys<T>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

// keyof with type alias
type Point = { x: number; y: number };
type PointKeys = keyof Point; // "x" | "y"

// keyof with index signatures
interface StringMap {
  [key: string]: string;
}
type StringMapKeys = keyof StringMap; // string

// keyof with number index
interface NumberArray {
  [index: number]: string;
}
type NumberArrayKeys = keyof NumberArray; // number

// Test usage
function main() {
  const person: Person = {
    name: "John",
    age: 30,
    email: "john@example.com",
  };

  // Valid key access
  const _name = getProperty(person, "name");
  const _age = getProperty(person, "age");

  // Get all keys
  const keys = getKeys(person);
  console.log("Person keys:", keys);

  // Iterate over keys
  const point: Point = { x: 10, y: 20 };
  const pointKeys = getKeys(point);
  console.log("Point keys:", pointKeys);
}

main();
