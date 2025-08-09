#!/usr/bin/env -S deno run --allow-all

/**
 * Comprehensive test suite for new JavaScript runtime types
 * Tests Symbol, BigInt, Function, and typed union wrappers
 */

import { transpile } from "../../src/mod.ts";
import { CMakeGenerator } from "../../src/cmake/generator.ts";
import { ensureDir } from "@std/fs";
import { basename, join } from "@std/path";
import type { TranspilerConfig } from "../../src/config/types.ts";

interface TestResult {
  name: string;
  transpiled: boolean;
  compiled: boolean;
  executed: boolean;
  output?: string;
  error?: string;
}

// Test for Symbol functionality
const symbolTest = `
// Symbol basic functionality test
console.log("=== Symbol Tests ===");

const sym1 = Symbol();
console.log("Basic symbol:", sym1.toString());

const sym2 = Symbol("description");
console.log("Symbol with description:", sym2.toString());

const sym3 = Symbol("description");
console.log("Symbols with same description are different:", sym2 !== sym3);

// Global symbol registry
const globalSym1 = Symbol.for("mykey");
const globalSym2 = Symbol.for("mykey");
console.log("Global symbols are same:", globalSym1 === globalSym2);

const key = Symbol.keyFor(globalSym1);
console.log("Key for global symbol:", key || "undefined");

// Well-known symbols
console.log("Symbol.iterator:", Symbol.iterator.toString());
console.log("Symbol.metadata:", Symbol.metadata.toString());
`;

// Test for BigInt functionality  
const bigintTest = `
// BigInt basic functionality test
console.log("=== BigInt Tests ===");

const big1 = BigInt(123);
console.log("BigInt from number:", big1.toString());

const big2 = BigInt("456");
console.log("BigInt from string:", big2.toString());

const big3 = big1 + big2;
console.log("BigInt addition:", big3.toString());

const big4 = big1 * BigInt(2);
console.log("BigInt multiplication:", big4.toString());

console.log("BigInt comparison:", big1 < big2);
console.log("BigInt equality:", big1 === BigInt(123));

// Static methods
const truncated = BigInt.asIntN(8, BigInt(300));
console.log("Truncated BigInt:", truncated.toString());
`;

// Test for Function wrapper functionality
const functionTest = `
// Function wrapper test
console.log("=== Function Tests ===");

function add(a: number, b: number): number {
  return a + b;
}

console.log("Function result:", add(5, 3));

// Arrow function with callback
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log("Mapped array:", doubled.join(", "));
`;

// Test for typed union wrappers
const unionTypesTest = `
// Typed union wrappers test
console.log("=== Union Types Tests ===");

// StringOrNumber test
const stringOrNum1 = "hello";
const stringOrNum2 = 42;

console.log("StringOrNumber (string):", stringOrNum1);
console.log("StringOrNumber (number):", stringOrNum2);
console.log("StringOrNumber concatenation:", stringOrNum1 + stringOrNum2);

// Nullable test
let nullable: string | null = "value";
console.log("Nullable has value:", nullable !== null);
console.log("Nullable value:", nullable || "default");

nullable = null;
console.log("Nullable is null:", nullable === null);
console.log("Nullable default value:", nullable || "default");

// Dictionary test (using object)
const dict = { key1: 100, key2: 200 };

console.log("Dictionary key1:", dict.key1);
console.log("Dictionary key3 (missing):", dict.key3 || -1);
console.log("Dictionary has key2:", "key2" in dict);
`;

// Comprehensive integration test combining all types
const integrationTest = `
// Integration test combining all new types
console.log("=== Integration Test ===");

interface Person {
  id: symbol;
  name: string;
  age?: number;
  balance: bigint;
  tags: (string | number)[];
}

// Create a person with all new types
const personId = Symbol.for("person_123");
const person: Person = {
  id: personId,
  name: "Alice",
  age: 30,
  balance: BigInt("1234567890123456789"),
  tags: ["developer", 5, "years"]
};

console.log("Person ID:", person.id.toString());
console.log("Person name:", person.name);
console.log("Person age:", person.age || "undefined");
console.log("Person balance:", person.balance.toString());

// Process tags with function
function processTag(tag: string | number): string {
  if (typeof tag === "string") {
    return tag.toUpperCase();
  } else {
    return tag.toString() + "_YEARS";
  }
}

console.log("Processed tags:");
for (const tag of person.tags) {
  console.log("  -", processTag(tag));
}

// Symbol comparison
const samePersonId = Symbol.for("person_123");
console.log("ID symbols match:", person.id === samePersonId);

// BigInt operations
const doubled = person.balance * BigInt(2);
console.log("Doubled balance:", doubled.toString());
`;

const tests = [
  { name: "symbol-test", code: symbolTest },
  { name: "bigint-test", code: bigintTest },
  { name: "function-test", code: functionTest },
  { name: "union-types-test", code: unionTypesTest },
  { name: "integration-test", code: integrationTest }
];

async function runTest(testName: string, code: string): Promise<TestResult> {
  const result: TestResult = {
    name: testName,
    transpiled: false,
    compiled: false,
    executed: false
  };

  try {
    console.log(`\n--- Testing ${testName} ---`);
    
    // Transpile TypeScript to C++
    const transpileResult = await transpile(code, {
      outputName: testName,
      runtime: "./runtime"
    });
    
    result.transpiled = true;
    console.log(`✅ ${testName}: Transpiled successfully`);

    // Create test directory
    const testDir = join(Deno.cwd(), ".output", "js-types-tests", testName);
    await ensureDir(testDir);

    // Write generated files
    await Promise.all([
      Deno.writeTextFile(join(testDir, testName + ".h"), transpileResult.header),
      Deno.writeTextFile(join(testDir, testName + ".cpp"), transpileResult.source)
    ]);

    // Copy runtime files to test directory 
    const runtimeDir = join(testDir, "runtime");
    await ensureDir(runtimeDir);
    
    const runtimeFiles = ["core.h", "typed_wrappers.h", "type_guards.h"];
    await Promise.all(runtimeFiles.map(async file => {
      const sourcePath = join(Deno.cwd(), "runtime", file);
      const destPath = join(runtimeDir, file);
      const content = await Deno.readTextFile(sourcePath);
      await Deno.writeTextFile(destPath, content);
    }));

    // Create CMakeLists.txt
    const generator = new CMakeGenerator({
      projectName: testName,
      minimumVersion: "3.20",
      cppStandard: "20",
      sourceFiles: [testName + ".cpp"],
      headerFiles: [testName + ".h"],
      includeDirs: ["."],
      libraries: [],
      findPackages: [],
      executable: true,
      outputName: testName
    });

    const cmakeContent = generator.generate();
    await Deno.writeTextFile(join(testDir, "CMakeLists.txt"), cmakeContent);

    // Build with CMake
    const configCmd = new Deno.Command("cmake", {
      args: ["-B", "build", "-S", ".", "-DCMAKE_BUILD_TYPE=Release"],
      cwd: testDir,
      stdout: "piped",
      stderr: "piped"
    });

    const configResult = await configCmd.output();
    
    if (!configResult.success) {
      result.error = `CMake configuration failed: ${new TextDecoder().decode(configResult.stderr)}`;
      return result;
    }

    const buildCmd = new Deno.Command("cmake", {
      args: ["--build", "build"],
      cwd: testDir,
      stdout: "piped", 
      stderr: "piped"
    });

    const buildResult = await buildCmd.output();

    if (!buildResult.success) {
      result.error = `Build failed: ${new TextDecoder().decode(buildResult.stderr)}`;
      return result;
    }

    result.compiled = true;
    console.log(`✅ ${testName}: Compiled successfully`);

    // Execute the test
    const execCmd = new Deno.Command(join(testDir, "build", testName), {
      stdout: "piped",
      stderr: "piped"
    });

    const execResult = await execCmd.output();
    
    if (execResult.success) {
      result.executed = true;
      result.output = new TextDecoder().decode(execResult.stdout);
      console.log(`✅ ${testName}: Executed successfully`);
      console.log("Output:", result.output);
    } else {
      result.error = `Execution failed: ${new TextDecoder().decode(execResult.stderr)}`;
    }

  } catch (error) {
    result.error = `Test failed: ${error.message}`;
    console.log(`❌ ${testName}: ${result.error}`);
  }

  return result;
}

async function runAllTests(): Promise<void> {
  console.log("🚀 Running JavaScript Types Test Suite");
  console.log("=====================================");

  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await runTest(test.name, test.code);
    results.push(result);
  }

  // Print summary
  console.log("\n📊 Test Results Summary");
  console.log("========================");

  const successful = results.filter(r => r.executed);
  const compiled = results.filter(r => r.compiled);
  const transpiled = results.filter(r => r.transpiled);

  console.log(`✅ Executed successfully: ${successful.length}/${results.length}`);
  console.log(`🔨 Compiled successfully: ${compiled.length}/${results.length}`);
  console.log(`📝 Transpiled successfully: ${transpiled.length}/${results.length}`);

  if (successful.length === results.length) {
    console.log("\n🎉 All JavaScript types tests passed!");
  } else {
    console.log("\n❌ Some tests failed:");
    for (const result of results) {
      if (!result.executed) {
        console.log(`  - ${result.name}: ${result.error || "Unknown error"}`);
      }
    }
  }

  // Save detailed results
  const reportPath = join(Deno.cwd(), ".output", "js-types-test-report.json");
  await ensureDir(join(Deno.cwd(), ".output"));
  await Deno.writeTextFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

if (import.meta.main) {
  await runAllTests();
}