/**
 * Definite assignment assertion (!) test cases
 * Tests the TypeScript ! operator on property declarations to suppress
 * TypeScript's strict property initialization checking
 */

// Basic class with definite assignment assertion
class BasicClass {
  // Definite assignment assertion - property will be assigned in constructor
  value!: string;

  // Another definite assignment
  count!: number;

  // Optional property for comparison (no assertion needed)
  optional?: boolean;

  constructor() {
    this.value = "initialized";
    this.count = 42;
    // optional is not assigned - that's fine
  }

  updateValue(newValue: string) {
    this.value = newValue;
  }

  getValue(): string {
    return this.value;
  }
}

// Interface for configuration (no definite assignment assertions in interfaces)
interface Config {
  apiUrl: string; // Will be set by initialization method
  timeout: number; // Will be set by initialization method
  debug?: boolean; // Optional, may not be set
}

// Class implementing interface with assertions
class ConfigManager implements Config {
  apiUrl!: string;
  timeout!: number;
  debug?: boolean;

  // Additional properties with assertions
  initialized!: boolean;
  settings!: { [key: string]: any };

  initialize(url: string, timeoutMs: number) {
    this.apiUrl = url;
    this.timeout = timeoutMs;
    this.initialized = true;
    this.settings = { theme: "dark" };
  }

  isReady(): boolean {
    return this.initialized;
  }
}

// Inheritance with definite assignment assertions
abstract class BaseService {
  serviceName!: string; // Subclasses must set this
  version!: number; // Subclasses must set this

  abstract init(): void;

  getInfo(): string {
    return `${this.serviceName} v${this.version}`;
  }
}

class UserService extends BaseService {
  userCount!: number; // Will be set in init

  init(): void {
    this.serviceName = "UserService";
    this.version = 1;
    this.userCount = 0;
  }

  addUser(): void {
    this.userCount++;
  }
}

// Generic class with definite assignment assertions
class Container<T> {
  data!: T;
  size!: number;
  capacity!: number;

  initialize(item: T, cap: number): void {
    this.data = item;
    this.size = 1;
    this.capacity = cap;
  }

  getData(): T {
    return this.data;
  }
}

// Static properties with definite assignment assertions
class StaticExample {
  static globalConfig: { [key: string]: any }; // Will be initialized in setup()
  static initialized: boolean; // Will be initialized in setup()

  instanceData!: string;

  static setup(): void {
    StaticExample.globalConfig = { mode: "production" };
    StaticExample.initialized = true;
  }

  constructor(data: string) {
    this.instanceData = data;
  }
}

// Mixed property types
class MixedProperties {
  // Definite assignment assertions
  definiteString!: string;
  definiteNumber!: number;
  definiteBoolean!: boolean;
  definiteObject!: { id: number; name: string };
  definiteArray!: string[];

  // Optional properties
  optionalString?: string;
  optionalNumber?: number;

  // Regular properties with initializers
  regularString: string = "default";
  regularNumber: number = 0;

  setup(): void {
    this.definiteString = "assigned";
    this.definiteNumber = 123;
    this.definiteBoolean = true;
    this.definiteObject = { id: 1, name: "test" };
    this.definiteArray = ["a", "b", "c"];
  }
}

// Readonly with definite assignment assertion
class ReadonlyExample {
  readonly id!: number; // Will be set in constructor
  readonly name!: string; // Will be set in constructor
  readonly created!: Date; // Will be set in constructor

  constructor(id: number, name: string) {
    // TypeScript allows assignment in constructor even for readonly
    (this as any).id = id;
    (this as any).name = name;
    (this as any).created = new Date();
  }
}

// Main function to test all scenarios
function main(): void {
  console.log("Definite assignment assertion test started");

  // Test BasicClass
  const basic = new BasicClass();
  console.log("Basic value:", basic.getValue());
  basic.updateValue("updated");
  console.log("Updated value:", basic.getValue());

  // Test ConfigManager
  const config = new ConfigManager();
  config.initialize("https://api.example.com", 5000);
  console.log("Config ready:", config.isReady());
  console.log("API URL:", config.apiUrl);

  // Test UserService
  const userService = new UserService();
  userService.init();
  console.log("Service info:", userService.getInfo());
  userService.addUser();

  // Test Container
  const stringContainer = new Container<string>();
  stringContainer.initialize("hello", 10);
  console.log("Container data:", stringContainer.getData());

  // Test StaticExample
  StaticExample.setup();
  const _staticExample = new StaticExample("instance");
  console.log("Static initialized:", StaticExample.initialized);

  // Test MixedProperties
  const mixed = new MixedProperties();
  mixed.setup();
  console.log("Mixed string:", mixed.definiteString);
  console.log("Regular string:", mixed.regularString);

  // Test ReadonlyExample
  const readonly = new ReadonlyExample(42, "readonly test");
  console.log("Readonly ID:", readonly.id);

  console.log("Definite assignment assertion test completed");
}

main();
