// Typeof Type Operator Test
// Tests TypeScript's typeof type operator for type extraction from values

// Basic typeof with variables
const stringValue = "hello";
const numberValue = 42;
const booleanValue = true;
const objectValue = { x: 10, y: 20 };
const arrayValue = [1, 2, 3];

// Extract types using typeof
type StringType = typeof stringValue; // string
type NumberType = typeof numberValue; // number
type BooleanType = typeof booleanValue; // boolean
type ObjectType = typeof objectValue; // { x: number; y: number }
type ArrayType = typeof arrayValue; // number[]

// Using typeof in variable declarations
const _anotherString: typeof stringValue = "world";
const _anotherNumber: typeof numberValue = 100;
const _anotherObject: typeof objectValue = { x: 5, y: 15 };

// Typeof with const assertions
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retryAttempts: 3,
  features: {
    logging: true,
    caching: false,
  },
} as const;

type ConfigType = typeof config;
// Results in:
// {
//   readonly apiUrl: "https://api.example.com";
//   readonly timeout: 5000;
//   readonly retryAttempts: 3;
//   readonly features: {
//     readonly logging: true;
//     readonly caching: false;
//   };
// }

// Typeof with functions
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const multiply = (a: number, b: number): number => {
  return a * b;
};

type GreetType = typeof greet; // (name: string) => string
type MultiplyType = typeof multiply; // (a: number, b: number) => number

// Using function types
const myGreet: typeof greet = (n: string) => `Hi, ${n}!`;
const myMultiply: typeof multiply = (x: number, y: number) => x * y;

console.log(myGreet("Alice"));
console.log(myMultiply(3, 4));

// Typeof with classes
class User {
  constructor(public name: string, public age: number) {}

  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const userInstance = new User("John", 30);

type UserInstanceType = typeof userInstance; // User
type UserClassType = typeof User; // typeof User (constructor function)

// Creating instances using typeof
function createInstance<T>(
  ctor: new (...args: any[]) => T,
  ...args: any[]
): T {
  return new ctor(...args);
}

const newUser = createInstance(User, "Jane", 25);
console.log(newUser.greet());

// Typeof with arrays and tuples
const numbers = [1, 2, 3, 4, 5];
const tuple = ["hello", 42, true] as const;

type NumbersType = typeof numbers; // number[]
type TupleType = typeof tuple; // readonly ["hello", 42, true]

// Typeof with enum
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

const myColor = Color.Red;
type ColorType = typeof myColor; // Color
type ColorEnumType = typeof Color; // typeof Color (enum object)

// Using enum type
const anotherColor: typeof myColor = Color.Blue;
console.log(anotherColor);

// Typeof in generic constraints
function _getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
};

type PersonType = typeof person;

function updatePerson(updates: Partial<typeof person>): void {
  Object.assign(person, updates);
}

updatePerson({ age: 31 });
console.log(person.age);

// Typeof with modules
const Utils = {
  version: "1.0.0",
  log: (message: string): void => {
    console.log(message);
  },
};

type UtilsType = typeof Utils; // module type

// Typeof with symbols
const symbolKey = Symbol("mySymbol");
type SymbolType = typeof symbolKey; // typeof symbolKey (unique symbol)

// Complex typeof patterns
const complexObject = {
  data: [1, 2, 3],
  process: (x: number) => x * 2,
  metadata: {
    created: new Date(),
    author: "Admin",
  },
};

type ComplexType = typeof complexObject;

// Using complex type
function processData(obj: typeof complexObject): number[] {
  return obj.data.map(obj.process);
}

const result = processData(complexObject);
console.log("Processed:", result);

// Typeof with discriminated unions
const action1 = { type: "ADD", payload: 10 } as const;
const action2 = { type: "REMOVE", payload: "item" } as const;

type Action1Type = typeof action1; // { readonly type: "ADD"; readonly payload: 10 }
type Action2Type = typeof action2; // { readonly type: "REMOVE"; readonly payload: "item" }

type ActionType = Action1Type | Action2Type;

function handleAction(action: ActionType): void {
  switch (action.type) {
    case "ADD":
      console.log("Adding:", action.payload);
      break;
    case "REMOVE":
      console.log("Removing:", action.payload);
      break;
  }
}

handleAction({ type: "ADD", payload: 10 });
handleAction({ type: "REMOVE", payload: "item" });

// ReturnType using typeof
function getData() {
  return {
    id: 1,
    name: "Test",
    values: [1, 2, 3],
  };
}

type DataType = ReturnType<typeof getData>;
// Results in: { id: number; name: string; values: number[] }

const myData: DataType = {
  id: 2,
  name: "My Data",
  values: [4, 5, 6],
};

console.log(myData);

console.log("Typeof type operator test completed");
