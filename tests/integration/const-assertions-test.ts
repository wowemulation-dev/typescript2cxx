// Const Assertions Test
// Tests TypeScript's const assertions (as const) for literal type narrowing

// Basic const assertions with literals
const literalString = "hello" as const; // Type: "hello"
const _literalNumber = 42 as const; // Type: 42
const _literalBoolean = true as const; // Type: true

// Object const assertions
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retryAttempts: 3,
  features: {
    logging: true,
    caching: false,
  },
} as const;

// Type is now:
// {
//   readonly apiUrl: "https://api.example.com";
//   readonly timeout: 5000;
//   readonly retryAttempts: 3;
//   readonly features: {
//     readonly logging: true;
//     readonly caching: false;
//   };
// }

// Array const assertions
const colors = ["red", "green", "blue"] as const;
// Type: readonly ["red", "green", "blue"]

const _numbers = [1, 2, 3, 4, 5] as const;
// Type: readonly [1, 2, 3, 4, 5]

const _mixed = ["hello", 42, true, { x: 10 }] as const;
// Type: readonly ["hello", 42, true, { readonly x: 10 }]

// Tuple const assertions
const _tuple = [10, "hello"] as const;
// Type: readonly [10, "hello"]

// Nested const assertions
const _nested = {
  data: [1, 2, 3] as const,
  settings: {
    mode: "dark" as const,
    level: 5 as const,
  },
};

// Using const assertions with functions
function getConfig() {
  return {
    host: "localhost",
    port: 8080,
    ssl: false,
  } as const;
}

const serverConfig = getConfig();
// serverConfig.port is type 8080, not number

// Const assertions with template literals
const prefix = "api" as const;
const version = "v1" as const;
const endpoint = `/${prefix}/${version}/users` as const;
// Type: "/api/v1/users"

// Const assertions preventing mutations
function processColors(colors: readonly string[]) {
  // colors.push("yellow"); // Error: Property 'push' does not exist on readonly array
  return colors.map((c) => c.toUpperCase());
}

const _result = processColors(["red", "green", "blue"] as const);

// Using const assertions for discriminated unions
const action1 = { type: "ADD", payload: 10 } as const;
const action2 = { type: "REMOVE", payload: "item" } as const;
const action3 = { type: "UPDATE", payload: { id: 1, value: "new" } } as const;

type Action = typeof action1 | typeof action2 | typeof action3;

function handleAction(action: Action) {
  switch (action.type) {
    case "ADD":
      console.log("Adding:", action.payload); // payload is 10
      break;
    case "REMOVE":
      console.log("Removing:", action.payload); // payload is "item"
      break;
    case "UPDATE":
      console.log("Updating:", action.payload.id, action.payload.value);
      break;
  }
}

// Const assertions with enums
const Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
} as const;

type DirectionType = typeof Direction[keyof typeof Direction];
// Type: 0 | 1 | 2 | 3

// Using const assertions for configuration objects
const DATABASE_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "myapp",
  credentials: {
    username: "admin",
    password: "secret",
  },
} as const;

type DatabaseConfig = typeof DATABASE_CONFIG;

function connectToDatabase(config: DatabaseConfig) {
  console.log(`Connecting to ${config.host}:${config.port}/${config.database}`);
}

connectToDatabase(DATABASE_CONFIG);

// Const assertions with satisfies (if supported)
const routes = {
  home: "/",
  about: "/about",
  contact: "/contact",
  api: {
    users: "/api/users",
    posts: "/api/posts",
  },
} as const;

type Routes = typeof routes;

// Function that only accepts specific route values
function navigateTo(route: Routes[keyof Routes] | Routes["api"][keyof Routes["api"]]) {
  console.log("Navigating to:", route);
}

navigateTo(routes.home);
navigateTo(routes.api.users);

// Testing const assertion behavior
console.log("Literal string:", literalString);
console.log("Config API URL:", config.apiUrl);
console.log("Colors:", colors);
console.log("Server config port:", serverConfig.port);
console.log("Endpoint:", endpoint);

// Process some actions
handleAction({ type: "ADD", payload: 10 } as const);
handleAction({ type: "REMOVE", payload: "item" } as const);

console.log("Const assertions test completed");
