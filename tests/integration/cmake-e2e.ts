#!/usr/bin/env -S deno run --allow-all

import { transpile } from "../../src/mod.ts";
import { generateCMakeFromConfig } from "../../src/cmake/config-integration.ts";
import { ensureDir } from "@std/fs";
import { basename, join } from "@std/path";
import { walk } from "@std/fs";
import type { TranspilerConfig } from "../../src/config/types.ts";

interface TestResult {
  name: string;
  path: string;
  transpiled: boolean;
  cmakeGenerated: boolean;
  configured: boolean;
  compiled: boolean;
  executed: boolean;
  output?: string;
  error?: string;
}

const results: TestResult[] = [];

async function processTestFile(testPath: string): Promise<TestResult> {
  const testName = basename(testPath, ".ts");
  const result: TestResult = {
    name: testName,
    path: testPath,
    transpiled: false,
    cmakeGenerated: false,
    configured: false,
    compiled: false,
    executed: false,
  };

  try {
    // Read test file
    const tsCode = await Deno.readTextFile(testPath);

    // Skip if it's a test file (not actual TypeScript to transpile)
    if (tsCode.includes("Deno.test") || tsCode.includes("import { assert")) {
      result.error = "Test file, not transpilable code";
      return result;
    }

    // Create output directory
    const outputDir = join("../../.output/cmake-tests", testName);
    await ensureDir(outputDir);

    // Transpile
    console.log(`  Transpiling ${testName}...`);
    const transpileResult = await transpile(tsCode, {
      outputName: testName,
      runtime: "../../runtime",
    });
    result.transpiled = true;

    // Write C++ files
    await Deno.writeTextFile(join(outputDir, `${testName}.h`), transpileResult.header);
    await Deno.writeTextFile(join(outputDir, `${testName}.cpp`), transpileResult.source);

    // Copy runtime
    const runtimeDir = join(outputDir, "runtime");
    await ensureDir(runtimeDir);
    await Deno.copyFile("../../runtime/core.h", join(runtimeDir, "core.h"));

    // Load configuration and generate CMakeLists.txt
    const { default: config } = await import("../../typescript2cxx.config.ts");
    const testConfig: TranspilerConfig = {
      ...config,
      runtime: {
        ...config.runtime,
        library: undefined, // Don't link external runtime library for testing
      },
      integration: {
        ...config.integration,
        cmake: {
          ...config.integration?.cmake,
          generate: true,
          projectName: testName.charAt(0).toUpperCase() + testName.slice(1),
          findPackages: [], // Override to remove external dependencies for testing
        },
      },
    };

    const cmakeContent = generateCMakeFromConfig(
      testConfig,
      [`${testName}.cpp`],
      [`${testName}.h`],
    );
    await Deno.writeTextFile(join(outputDir, "CMakeLists.txt"), cmakeContent);
    result.cmakeGenerated = true;

    // Create build directory
    const buildDir = join(outputDir, "build");
    await ensureDir(buildDir);

    // Configure with CMake
    console.log(`  Configuring ${testName}...`);
    const configureCmd = new Deno.Command("cmake", {
      args: [".."],
      cwd: buildDir,
      stdout: "piped",
      stderr: "piped",
    });
    const configureResult = await configureCmd.output();

    if (!configureResult.success) {
      result.error = "CMake configuration failed";
      return result;
    }
    result.configured = true;

    // Build with CMake
    console.log(`  Building ${testName}...`);
    const buildCmd = new Deno.Command("cmake", {
      args: ["--build", "."],
      cwd: buildDir,
      stdout: "piped",
      stderr: "piped",
    });
    const buildResult = await buildCmd.output();

    if (!buildResult.success) {
      const stderr = new TextDecoder().decode(buildResult.stderr);
      // Extract first error
      const errorMatch = stderr.match(/error: (.+)/);
      result.error = errorMatch ? errorMatch[1].trim() : "Compilation failed";
      return result;
    }
    result.compiled = true;

    // Try to run the executable
    console.log(`  Running ${testName}...`);
    const exePath = join(buildDir, testName);
    const runCmd = new Deno.Command(exePath, {
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const runResult = await runCmd.output();
      result.executed = runResult.success;
      if (runResult.success) {
        result.output = new TextDecoder().decode(runResult.stdout).trim();
      } else {
        result.error = new TextDecoder().decode(runResult.stderr).trim();
      }
    } catch (e) {
      result.error = `Execution failed: ${e.message}`;
    }
  } catch (e) {
    result.error = e.message;
  }

  return result;
}

async function findTestFiles(): Promise<string[]> {
  const testFiles: string[] = [];

  // Look for TypeScript files in simple-tests directory first
  try {
    for await (
      const entry of walk("../../simple-tests", {
        exts: [".ts"],
        skip: [/node_modules/, /\.test\.ts$/, /\.spec\.ts$/],
      })
    ) {
      testFiles.push(entry.path);
    }
  } catch {
    // Directory might not exist
  }

  // Look for TypeScript files in examples directory
  for await (
    const entry of walk("../../examples", {
      exts: [".ts"],
      skip: [/node_modules/, /\.test\.ts$/, /\.spec\.ts$/],
    })
  ) {
    testFiles.push(entry.path);
  }

  // Also check tests/fixtures for simple TypeScript files
  try {
    for await (
      const entry of walk("../fixtures", {
        exts: [".ts"],
        skip: [/node_modules/, /\.test\.ts$/, /\.spec\.ts$/],
      })
    ) {
      testFiles.push(entry.path);
    }
  } catch {
    // Directory might not exist
  }

  return testFiles;
}

async function main() {
  console.log("=== TypeScript to C++ CMake Build Test Suite ===\n");

  // Find all test files
  const testFiles = await findTestFiles();
  console.log(`Found ${testFiles.length} test files to process\n`);

  // Process each test file
  for (const testFile of testFiles) {
    console.log(`Processing ${testFile}...`);
    const result = await processTestFile(testFile);
    results.push(result);
  }

  // Generate summary report
  console.log("\n=== Test Results Summary ===\n");

  const successful = results.filter((r) => r.executed);
  const compiled = results.filter((r) => r.compiled && !r.executed);
  const configured = results.filter((r) => r.configured && !r.compiled);
  const transpiled = results.filter((r) => r.transpiled && !r.configured);
  const failed = results.filter((r) => !r.transpiled);

  console.log(`✅ Fully Successful (runs): ${successful.length}`);
  for (const r of successful) {
    console.log(
      `   - ${r.name}: ${r.output?.substring(0, 50)}${
        r.output && r.output.length > 50 ? "..." : ""
      }`,
    );
  }

  console.log(`\n🔨 Compiled but didn't run: ${compiled.length}`);
  for (const r of compiled) {
    console.log(`   - ${r.name}: ${r.error}`);
  }

  console.log(`\n⚙️ Configured but didn't compile: ${configured.length}`);
  for (const r of configured) {
    console.log(`   - ${r.name}: ${r.error}`);
  }

  console.log(`\n📝 Transpiled but didn't configure: ${transpiled.length}`);
  for (const r of transpiled) {
    console.log(`   - ${r.name}: ${r.error}`);
  }

  console.log(`\n❌ Failed to transpile: ${failed.length}`);
  for (const r of failed) {
    console.log(`   - ${r.name}: ${r.error}`);
  }

  // Calculate success rate
  const totalTests = results.length;
  const successRate = (successful.length / totalTests * 100).toFixed(1);
  const compileRate = ((successful.length + compiled.length) / totalTests * 100).toFixed(1);

  console.log(`\n=== Statistics ===`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`Execution success rate: ${successRate}%`);
  console.log(`Compilation success rate: ${compileRate}%`);

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      successful: successful.length,
      compiled: compiled.length,
      configured: configured.length,
      transpiled: transpiled.length,
      failed: failed.length,
    },
    results: results,
  };

  await ensureDir("../../.output/reports");
  await Deno.writeTextFile(
    "../../.output/reports/cmake-test-report.json",
    JSON.stringify(report, null, 2),
  );
  console.log("\nDetailed report saved to .output/reports/cmake-test-report.json");
}

// Check if cmake is available
try {
  const checkCmd = new Deno.Command("cmake", {
    args: ["--version"],
    stdout: "null",
    stderr: "null",
  });
  await checkCmd.output();

  // Run tests
  await main();
} catch {
  console.error("CMake is not installed or not in PATH");
  console.error("Please install CMake to run this test suite");
}
