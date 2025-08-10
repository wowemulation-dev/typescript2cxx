// Satisfies Operator Test
// Tests TypeScript's satisfies operator for type validation without type narrowing

// Basic satisfies operator usage
const colors = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
} satisfies Record<string, string>;

// The type is still the specific object type, not Record<string, string>
// This allows us to access specific properties
const _redColor: string = colors.red;

// With satisfies, we can ensure an object matches a type while preserving its literal type
const config = {
  host: "localhost",
  port: 8080,
  ssl: false,
} satisfies {
  host: string;
  port: number;
  ssl: boolean;
};

// Type is preserved - we can access properties with their literal types
const _port: 8080 = config.port; // Type is 8080, not number

// Satisfies with const assertion
const routes = {
  home: "/",
  about: "/about",
  contact: "/contact",
} as const satisfies Record<string, string>;

// Function with satisfies
function getConfig() {
  return {
    apiUrl: "https://api.example.com",
    timeout: 5000,
    retryAttempts: 3,
  } satisfies {
    apiUrl: string;
    timeout: number;
    retryAttempts: number;
  };
}

// Variable declaration with satisfies
const apiConfig = getConfig();

// Satisfies with union types
type Status = "loading" | "success" | "error";
const currentStatus = "success" satisfies Status;

// Satisfies with arrays
const _numbers = [1, 2, 3, 4, 5] satisfies number[];
const _mixedArray = [1, "two", true, { x: 10 }] satisfies unknown[];

// Satisfies with nested objects
const user = {
  id: 1,
  name: "John Doe",
  settings: {
    theme: "dark",
    notifications: true,
  },
} satisfies {
  id: number;
  name: string;
  settings: {
    theme: string;
    notifications: boolean;
  };
};

// Satisfies with optional properties
interface UserProfile {
  username: string;
  email?: string;
  age?: number;
}

const profile = {
  username: "johndoe",
  email: "john@example.com",
} satisfies UserProfile;

// Satisfies with generic types
interface Container<T> {
  value: T;
  setValue: (val: T) => void;
}

const _stringContainer = {
  value: "hello",
  setValue: (val: string) => {
    console.log("Setting value:", val);
  },
} satisfies Container<string>;

// Complex satisfies with multiple constraints
type Theme = "light" | "dark" | "auto";
type Language = "en" | "es" | "fr";

const preferences = {
  theme: "dark",
  language: "en",
  fontSize: 14,
} satisfies {
  theme: Theme;
  language: Language;
  fontSize: number;
};

// Testing the results
console.log("Colors red:", colors.red);
console.log("Config port:", config.port);
console.log("Routes home:", routes.home);
console.log("API config:", apiConfig.apiUrl);
console.log("Current status:", currentStatus);
console.log("User name:", user.name);
console.log("Profile username:", profile.username);
console.log("Preferences theme:", preferences.theme);

console.log("Satisfies operator test completed");
