// Template Literal Types Test
// Tests TypeScript's template literal types feature

// Basic template literal types
type Greeting = `Hello, ${string}!`;
type EventName = `on${string}`;

// With unions
type Status = "loading" | "success" | "error";
type StatusMessage = `Status: ${Status}`;

// With multiple placeholders
type Route = `/${string}/${string}`;
type ApiEndpoint = `/api/${string}`;

// Uppercase/Lowercase transformers
type UppercaseGreeting = `HELLO ${Uppercase<string>}`;
type LowercaseEvent = `on${Lowercase<string>}`;

// Practical examples
function makeWatchedObject<T>(obj: T): T & {
  on(eventName: `${string}Changed`, callback: (newValue: any) => void): void;
} {
  const result = { ...obj } as any;
  result.on = (eventName: string, _callback: (newValue: any) => void) => {
    console.log(`Watching for ${eventName}`);
  };
  return result;
}

// Using template literal types
const person = makeWatchedObject({
  firstName: "John",
  lastName: "Doe",
  age: 30,
});

// These would be type-safe with template literal types
person.on("firstNameChanged", (newName) => {
  console.log(`First name changed to ${newName}`);
});

person.on("ageChanged", (newAge) => {
  console.log(`Age changed to ${newAge}`);
});

// String manipulation with template literal types
type EmailDomain = `${string}@example.com`;
type URLPath = `https://${string}.com/${string}`;

function sendEmail(email: EmailDomain) {
  console.log(`Sending email to ${email}`);
}

function fetchFromAPI(url: URLPath) {
  console.log(`Fetching from ${url}`);
}

// Using the functions
sendEmail("user@example.com");
fetchFromAPI("https://api.com/users");

// Template literal types with conditional types
type PropEventSource<Type> = {
  on(eventName: `${string & keyof Type}Changed`, callback: (newValue: any) => void): void;
};

// Combining with mapped types
type PropEventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (value: T[K]) => void;
};

interface Person {
  name: string;
  age: number;
  location: string;
}

type PersonEventHandlers = PropEventHandlers<Person>;
// Results in:
// {
//   onNameChange: (value: string) => void;
//   onAgeChange: (value: number) => void;
//   onLocationChange: (value: string) => void;
// }

// Simple runtime demonstration
function createEventHandler(): PersonEventHandlers {
  return {
    onNameChange: (value: string) => console.log(`Name changed to ${value}`),
    onAgeChange: (value: number) => console.log(`Age changed to ${value}`),
    onLocationChange: (value: string) => console.log(`Location changed to ${value}`),
  };
}

const handlers = createEventHandler();
handlers.onNameChange("Alice");
handlers.onAgeChange(25);
handlers.onLocationChange("New York");

console.log("Template literal types test completed");
