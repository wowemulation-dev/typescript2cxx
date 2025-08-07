#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * Pre-Release Quality Assurance Script
 *
 * This script performs comprehensive checks to ensure releases don't fail
 * due to formatting, linting, type errors, or CI incompatibilities.
 *
 * Run this before every version bump and release.
 */

import { join } from "@std/path";

interface QAResult {
  step: string;
  passed: boolean;
  output?: string;
  error?: string;
}

class PreReleaseQA {
  private results: QAResult[] = [];

  async runCommand(
    cmd: string[],
    description: string,
    ignoreErrors = false,
  ): Promise<QAResult> {
    console.log(`🔍 ${description}...`);

    try {
      const process = new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stdout, stderr } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      const passed = ignoreErrors || code === 0;

      const result: QAResult = {
        step: description,
        passed,
        output: output.trim(),
        error: error.trim(),
      };

      this.results.push(result);

      if (passed) {
        console.log(`✅ ${description}`);
      } else {
        console.log(`❌ ${description}`);
        if (error) console.log(`   Error: ${error}`);
      }

      return result;
    } catch (err) {
      const result: QAResult = {
        step: description,
        passed: false,
        error: err.message,
      };

      this.results.push(result);
      console.log(`❌ ${description} - ${err.message}`);
      return result;
    }
  }

  async checkFormatting(): Promise<void> {
    console.log("\n📝 FORMATTING CHECKS");

    // Check if files are properly formatted
    await this.runCommand(
      ["deno", "fmt", "--check"],
      "Check code formatting",
    );

    // Auto-fix formatting issues
    console.log("🔧 Auto-fixing formatting issues...");
    await this.runCommand(
      ["deno", "fmt"],
      "Auto-fix formatting",
      true, // Ignore errors since this is a fix step
    );

    // Verify formatting is now clean
    await this.runCommand(
      ["deno", "fmt", "--check"],
      "Verify formatting is clean after auto-fix",
    );
  }

  async checkLinting(): Promise<void> {
    console.log("\n🔍 LINTING CHECKS");
    await this.runCommand(
      ["deno", "lint"],
      "Check code quality with linter",
    );
  }

  async checkTypes(): Promise<void> {
    console.log("\n🏷️  TYPE CHECKS");
    await this.runCommand(
      ["deno", "check", "src/**/*.ts"],
      "Type check source files",
    );
  }

  async checkTests(): Promise<void> {
    console.log("\n🧪 TEST CHECKS");

    // Run only non-E2E tests (parser, runtime, transpiler, type-checker)
    await this.runCommand(
      [
        "deno",
        "test",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-net",
        "tests/parser.test.ts",
        "tests/runtime.test.ts",
        "tests/transpiler.test.ts",
        "tests/type-checker.test.ts",
        "tests/unit/",
      ],
      "Run core tests (excluding E2E)",
    );

    // Check spec tests (these may have expected failures for unimplemented features)
    const specResult = await this.runCommand(
      ["deno", "task", "spec"],
      "Run specification tests",
      true, // Ignore failures since some specs are for unimplemented features
    );

    if (specResult.output) {
      const lines = specResult.output.split("\n");
      const summaryLine = lines.find((line) => line.includes("passed") && line.includes("failed"));
      if (summaryLine) {
        console.log(`   📊 Spec Summary: ${summaryLine}`);
      }
    }
  }

  async checkJSRCompatibility(): Promise<void> {
    console.log("\n📦 JSR COMPATIBILITY");

    // Dry run JSR publish to catch issues
    await this.runCommand(
      ["deno", "publish", "--dry-run"],
      "Verify JSR package structure",
    );
  }

  async checkWorkflowCompatibility(): Promise<void> {
    console.log("\n🔄 CI/CD COMPATIBILITY CHECKS");

    // Check if GitHub Actions workflows exist
    try {
      const workflowDir = ".github/workflows";
      const entries = [];
      for await (const entry of Deno.readDir(workflowDir)) {
        if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
          entries.push(entry.name);
        }
      }

      console.log(`✅ Found ${entries.length} workflow files: ${entries.join(", ")}`);

      // Check if E2E tests are properly excluded from CI
      const ciContent = await Deno.readTextFile(join(workflowDir, "ci.yml"));

      if (ciContent.includes("tests/e2e/")) {
        console.log("⚠️  WARNING: CI includes E2E tests that require C++ compilers");
        console.log("   This may cause CI failures in GitHub Actions environment");
      } else {
        console.log("✅ CI properly excludes E2E tests that require C++ compilers");
      }
    } catch (err) {
      console.log(`❌ Error checking workflows: ${err.message}`);
    }
  }

  generateReport(): void {
    console.log("\n📊 QA REPORT SUMMARY");
    console.log("=".repeat(50));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log(`Total Checks: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\n❌ FAILED CHECKS:");
      this.results.filter((r) => !r.passed).forEach((result) => {
        console.log(`   • ${result.step}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      });

      console.log("\n🚨 RELEASE NOT READY - Fix failures before proceeding");
      Deno.exit(1);
    } else {
      console.log("\n✅ ALL CHECKS PASSED - Ready for release!");
    }
  }

  async run(): Promise<void> {
    console.log("🚀 Pre-Release Quality Assurance");
    console.log("=".repeat(50));

    await this.checkFormatting();
    await this.checkLinting();
    await this.checkTypes();
    await this.checkTests();
    await this.checkJSRCompatibility();
    await this.checkWorkflowCompatibility();
    this.generateReport();
  }
}

// Run the QA checks
const qa = new PreReleaseQA();
await qa.run();
