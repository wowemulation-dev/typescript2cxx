/**
 * Cross-platform C++ test runner for end-to-end testing
 * Compiles and executes generated C++ code to verify correctness
 */

import { resolve } from "@std/path";

interface CompilerInfo {
  name: string;
  checkCommand: string[];
  compileCommand: (
    outputFile: string,
    sourceFiles: string[],
    includePath: string,
  ) => string[];
  executableExtension: string;
}

export class CrossPlatformTestRunner {
  private static compilers: CompilerInfo[] = [
    {
      name: "clang++",
      checkCommand: ["clang++", "--version"],
      compileCommand: (output, sources, include) => [
        "clang++",
        "-std=c++20",
        "-fcoroutines",
        "-Wno-switch",
        "-Wno-deprecated-declarations",
        `-I${include}`,
        ...sources,
        "-o",
        output,
      ],
      executableExtension: Deno.build.os === "windows" ? ".exe" : "",
    },
    {
      name: "g++",
      checkCommand: ["g++", "--version"],
      compileCommand: (output, sources, include) => [
        "g++",
        "-std=c++20",
        "-fcoroutines",
        "-Wno-switch",
        "-Wno-deprecated-declarations",
        `-I${include}`,
        ...sources,
        "-o",
        output,
      ],
      executableExtension: Deno.build.os === "windows" ? ".exe" : "",
    },
    {
      name: "cl (MSVC)",
      checkCommand: ["cl", "/?"],
      compileCommand: (output, sources, include) => [
        "cl",
        "/EHsc",
        "/std:c++20",
        `/Fe:${output}`,
        `/I`,
        include,
        ...sources,
      ],
      executableExtension: ".exe",
    },
  ];

  private selectedCompiler: CompilerInfo | null = null;
  private tempDir: string | null = null;

  constructor() {
    // Compiler detection will be done on first use
  }

  public async detectCompiler(): Promise<void> {
    if (this.selectedCompiler) return; // Already detected

    for (const compiler of CrossPlatformTestRunner.compilers) {
      try {
        const command = new Deno.Command(compiler.checkCommand[0], {
          args: compiler.checkCommand.slice(1),
          stdout: "piped",
          stderr: "piped",
        });

        const { success } = await command.output();
        if (success) {
          this.selectedCompiler = compiler;
          console.log(`Detected C++ compiler: ${compiler.name}`);
          break;
        }
      } catch {
        // Compiler not found, try next
      }
    }

    if (!this.selectedCompiler) {
      throw new Error(
        "No C++ compiler found. Please install clang++, g++, or MSVC.",
      );
    }
  }

  public async compile(
    sourceFiles: string[],
    outputName: string,
    includePath: string,
  ): Promise<{ success: boolean; output: string }> {
    if (!this.selectedCompiler) {
      await this.detectCompiler();
      if (!this.selectedCompiler) {
        return { success: false, output: "No compiler selected" };
      }
    }

    const outputFile = outputName + this.selectedCompiler.executableExtension;
    const compileArgs = this.selectedCompiler.compileCommand(
      outputFile,
      sourceFiles,
      includePath,
    );

    const command = new Deno.Command(compileArgs[0], {
      args: compileArgs.slice(1),
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const { success, stdout, stderr } = await command.output();

      if (!success) {
        const decoder = new TextDecoder();
        const output = decoder.decode(stderr) || decoder.decode(stdout) || "";
        return { success: false, output };
      }

      // Clean up object files if using MSVC
      if (this.selectedCompiler.name === "cl (MSVC)") {
        for await (const entry of Deno.readDir(".")) {
          if (entry.name.endsWith(".obj")) {
            await Deno.remove(entry.name);
          }
        }
      }

      return { success: true, output: outputFile };
    } catch (error) {
      return { success: false, output: (error as Error).message };
    }
  }

  public async execute(
    executablePath: string,
  ): Promise<{ success: boolean; output: string }> {
    try {
      // Use the absolute path as provided by the compiler
      const fullPath = executablePath;

      const command = new Deno.Command(fullPath, {
        stdout: "piped",
        stderr: "piped",
      });

      const { success, stdout, stderr } = await command.output();
      const decoder = new TextDecoder();

      if (!success) {
        const errorOutput = decoder.decode(stderr) || decoder.decode(stdout) ||
          "";
        return { success: false, output: errorOutput };
      }

      const output = decoder.decode(stdout);
      return { success: true, output };
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("ENOENT")) {
        return {
          success: false,
          output: `Executable not found: ${executablePath}`,
        };
      }
      return { success: false, output: err.message };
    }
  }

  public getExecutableExtension(): string {
    return this.selectedCompiler?.executableExtension || "";
  }

  public async createTempDir(): Promise<string> {
    this.tempDir = await Deno.makeTempDir({ prefix: "ts2cxx_test_" });
    return this.tempDir;
  }

  public async cleanup(): Promise<void> {
    if (this.tempDir) {
      try {
        await Deno.remove(this.tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
      this.tempDir = null;
    }
  }

  /**
   * Run a complete end-to-end test
   * @param tsCode TypeScript source code
   * @param expectedOutput Expected console output
   * @param runtimePath Path to runtime headers
   * @returns Test result
   */
  public async runTest(
    tsCode: string,
    expectedOutput: string,
    runtimePath: string,
  ): Promise<{ success: boolean; message: string }> {
    const tempDir = await this.createTempDir();

    try {
      // Import transpiler
      const { transpile } = await import("./transpiler.ts");

      // Convert runtime path to absolute path
      const absoluteRuntimePath = resolve(runtimePath);
      const runtimeInclude = `${absoluteRuntimePath}/core.h`;

      // Transpile TypeScript to C++
      const result = await transpile(tsCode, {
        outputName: "test",
        runtimeInclude,
      });

      // Check for transpilation errors (transpile doesn't throw, it returns warnings)
      const errors = result.warnings.filter((w) => w.severity === "error");
      if (errors.length > 0) {
        return {
          success: false,
          message: `Transpilation failed: ${errors[0].message}`,
        };
      }

      // Write generated files
      const headerPath = `${tempDir}/test.h`;
      const sourcePath = `${tempDir}/test.cpp`;

      await Deno.writeTextFile(headerPath, result.header || "");
      await Deno.writeTextFile(sourcePath, result.source || "");

      // Compile the generated code
      const compileResult = await this.compile(
        [sourcePath],
        `${tempDir}/test`,
        runtimePath,
      );

      if (!compileResult.success) {
        return {
          success: false,
          message: `Compilation failed: ${compileResult.output}`,
        };
      }

      // Execute the compiled program
      const execResult = await this.execute(compileResult.output);

      if (!execResult.success) {
        return {
          success: false,
          message: `Execution failed: ${execResult.output}`,
        };
      }

      // Compare output
      const actualOutput = execResult.output.trim();
      const expected = expectedOutput.trim();

      if (actualOutput !== expected) {
        return {
          success: false,
          message: `Output mismatch:\nExpected: ${expected}\nActual: ${actualOutput}`,
        };
      }

      return { success: true, message: "Test passed" };
    } finally {
      await this.cleanup();
    }
  }
}

/**
 * Convenience function to run a single test
 */
export async function runEndToEndTest(
  tsCode: string,
  expectedOutput: string,
  runtimePath = "./runtime",
): Promise<void> {
  const runner = new CrossPlatformTestRunner();
  const result = await runner.runTest(tsCode, expectedOutput, runtimePath);

  if (!result.success) {
    throw new Error(result.message);
  }
}
