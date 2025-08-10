// Index Types and Indexed Access Test
// Tests TypeScript's index types and indexed access features

// Basic indexed access types
interface Person {
  name: string;
  age: number;
  email: string;
}

// Indexed access - T[K]
type PersonName = Person["name"]; // string
type PersonAge = Person["age"]; // number
type PersonProperty = Person["name" | "age"]; // string | number

// Generic indexed access
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Index signatures
interface StringDictionary {
  [key: string]: string;
}

interface NumberDictionary {
  [index: number]: string;
}

// Mixed index signatures
interface MixedDictionary {
  [key: string]: string | number;
  length: number; // Special property
  name: string; // Special property
}

// Using index types
const person: Person = {
  name: "John",
  age: 30,
  email: "john@example.com",
};

const _name = getProperty(person, "name"); // string
const _age = getProperty(person, "age"); // number

// String index signature usage
const dict: StringDictionary = {
  hello: "world",
  foo: "bar",
  baz: "qux",
};

dict["newKey"] = "newValue";
console.log(dict["hello"]);

// Number index signature usage
const arr: NumberDictionary = {
  0: "first",
  1: "second",
  2: "third",
};

console.log(arr[0]);
console.log(arr[1]);

// Mixed dictionary usage
const mixed: MixedDictionary = {
  length: 10,
  name: "MyDictionary",
  key1: "value1",
  key2: 42,
};

console.log(mixed.length);
console.log(mixed["key1"]);

// Index types with mapped types
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NullablePerson = Nullable<Person>;
// Results in:
// {
//   name: string | null;
//   age: number | null;
//   email: string | null;
// }

// Pick utility using index types
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type PersonNameAndAge = Pick<Person, "name" | "age">;
// Results in:
// {
//   name: string;
//   age: number;
// }

// Function to demonstrate Pick-like behavior
function pickProperties<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

const nameAndAge = pickProperties(person, ["name", "age"]);
console.log(nameAndAge.name);
console.log(nameAndAge.age);

// Index access with arrays
type ArrayElement<T> = T extends (infer U)[] ? U : never;
type StringArrayElement = ArrayElement<string[]>; // string

// Tuple indexed access
type Tuple = [string, number, boolean];
type FirstElement = Tuple[0]; // string
type SecondElement = Tuple[1]; // number
type TupleLength = Tuple["length"]; // 3

// Using index types in practice
function pluck<T, K extends keyof T>(objects: T[], key: K): T[K][] {
  return objects.map((obj) => obj[key]);
}

const people: Person[] = [
  { name: "Alice", age: 25, email: "alice@example.com" },
  { name: "Bob", age: 30, email: "bob@example.com" },
  { name: "Charlie", age: 35, email: "charlie@example.com" },
];

const names = pluck(people, "name"); // string[]
const ages = pluck(people, "age"); // number[]

console.log("Names:", names);
console.log("Ages:", ages);

console.log("Index types test completed");
