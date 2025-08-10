/**
 * Non-null assertion operator (!) test cases
 * Tests the TypeScript ! operator for removing null/undefined from types
 */

// Basic non-null assertion
function testBasicNonNull(value: string | null): number {
  return value!.length; // Assert value is not null
}

// Object property non-null assertion
interface User {
  name: string;
  email?: string;
}

function testObjectNonNull(user: User | null): string {
  return user!.name; // Assert user is not null
}

// Optional property non-null assertion
function testOptionalNonNull(user: User): string {
  return user.email!; // Assert email is defined
}

// Chained non-null assertions
interface DataStructure {
  user?: User | null;
  config?: {
    settings?: {
      theme?: string;
    };
  };
}

function testChainedNonNull(data: DataStructure | null): string {
  return data!.user!.name; // Multiple assertions
}

function testNestedNonNull(data: DataStructure | null): string {
  return data!.config!.settings!.theme!; // Deeply nested assertions
}

// Array element non-null assertion
function testArrayNonNull(items: (string | null)[]): string {
  return items[0]!; // Assert first element is not null
}

// Function call non-null assertion
function maybeGetUser(): User | null {
  return { name: "Alice", email: "alice@example.com" };
}

function testFunctionNonNull(): string {
  return maybeGetUser()!.name; // Assert function returns non-null
}

// Property access non-null assertion
class Container {
  data: { value?: string } | null = null;

  getValue(): string {
    return this.data!.value!; // Assert both data and value are not null
  }
}

// Complex expression non-null assertion
function testComplexExpression(users: User[] | null): string {
  return users![0]!.email!; // Multiple assertions in complex expression
}

// Non-null with method call
interface Service {
  getData(): string | null;
}

// Main function to test all scenarios
function main(): void {
  console.log("Non-null assertion test started");

  // Test basic scenarios
  const _result1 = testBasicNonNull("hello");
  const _user: User = { name: "John", email: "john@example.com" };
  const _result2 = testObjectNonNull(_user);
  const _result3 = testOptionalNonNull(_user);

  // Test complex scenarios
  const _data: DataStructure = {
    user: { name: "Alice" },
    config: { settings: { theme: "dark" } },
  };
  const _result4 = testChainedNonNull(_data);
  const _result5 = testNestedNonNull(_data);

  // Test other scenarios
  const _items = ["first", "second"];
  const _result6 = testArrayNonNull(_items);
  const _result7 = testFunctionNonNull();

  const _container = new Container();
  _container.data = { value: "test" };
  const _result8 = _container.getValue();

  const _users = [{ name: "Bob", email: "bob@example.com" }];
  const _result9 = testComplexExpression(_users);

  console.log("Non-null assertion test completed");
}

main();
