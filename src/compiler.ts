/**
 * Compiler module for compiling generated C++ code
 */

import { transpileFile } from "./transpiler.ts";
import type { TranspileOptions } from "./types.ts";

/**
 * Compile options
 */
export interface CompileOptions extends TranspileOptions {
  /** Output directory */
  outputDir?: string;

  /** Output file name (without extension) */
  outputName?: string;

  /** Compile to executable */
  buildExecutable?: boolean;

  /** C++ compiler to use */
  compiler?: "clang++" | "g++" | "msvc" | "auto";

  /** Additional compiler flags */
  compilerFlags?: string[];

  /** Additional linker flags */
  linkerFlags?: string[];

  /** Additional libraries to link */
  libraries?: string[];

  /** Runtime library path */
  runtimePath?: string;

  /** Generate debug info */
  debug?: boolean;

  /** Verbose output */
  verbose?: boolean;

  /** Dry run (don't actually compile) */
  dryRun?: boolean;
}

/**
 * Compile result
 */
export interface CompileResult {
  /** Generated header path */
  headerPath: string;

  /** Generated source path */
  sourcePath: string;

  /** Executable path (if built) */
  executablePath?: string;

  /** Compilation command used */
  command?: string[];

  /** Compilation output */
  output?: string;

  /** Success status */
  success: boolean;
}

/**
 * Compile TypeScript file to C++ and optionally build executable
 */
export async function compile(
  filePath: string,
  options: CompileOptions = {},
): Promise<CompileResult> {
  // Set default options
  const outputDir = options.outputDir ?? ".";
  const baseName = options.outputName ?? getBaseName(filePath);
  const headerPath = `${outputDir}/${baseName}.h`;
  const sourcePath = `${outputDir}/${baseName}.cpp`;

  // Transpile to C++
  const result = await transpileFile(filePath, {
    ...options,
    filename: filePath,
    outputName: baseName,
  });

  // Ensure output directory exists
  await Deno.mkdir(outputDir, { recursive: true });

  // Write generated files
  await Deno.writeTextFile(headerPath, result.header);
  await Deno.writeTextFile(sourcePath, result.source);

  if (options.verbose) {
    console.log(`Generated ${headerPath}`);
    console.log(`Generated ${sourcePath}`);
  }

  // Optionally compile to executable
  if (options.buildExecutable && !options.dryRun) {
    const compileResult = await compileCpp(sourcePath, {
      ...options,
      outputName: baseName,
      outputDir,
      runtimePath: options.runtimeInclude, // Pass runtime include path for compilation
    });

    return {
      headerPath,
      sourcePath,
      executablePath: compileResult.executablePath,
      command: compileResult.command,
      output: compileResult.output,
      success: compileResult.success,
    };
  }

  return {
    headerPath,
    sourcePath,
    success: true,
  };
}

/**
 * Compile C++ source to executable
 */
async function compileCpp(
  sourcePath: string,
  options: CompileOptions,
): Promise<CompileResult> {
  const compiler = await detectCompiler(options.compiler);
  const outputName = options.outputName ?? "a.out";
  const outputDir = options.outputDir ?? ".";
  const executablePath = `${outputDir}/${outputName}${getExecutableExtension()}`;

  // Build compiler command
  const command = buildCompilerCommand(compiler, {
    source: sourcePath,
    output: executablePath,
    standard: options.standard ?? "c++20",
    optimization: options.optimization ?? "O2",
    debug: options.debug ?? false,
    includePaths: [
      ...(options.includePaths ?? []),
      getRuntimeIncludePath(options.runtimePath),
    ],
    flags: options.compilerFlags ?? [],
    linkerFlags: options.linkerFlags ?? [],
    libraries: options.libraries ?? [],
  });

  if (options.verbose || options.dryRun) {
    console.log("Compile command:", command.join(" "));
  }

  if (options.dryRun) {
    return {
      headerPath: "",
      sourcePath,
      executablePath,
      command,
      success: true,
    };
  }

  // Run compiler
  const process = new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await process.output();

  const output = new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);

  if (options.verbose && output) {
    console.log(output);
  }

  return {
    headerPath: "",
    sourcePath,
    executablePath: code === 0 ? executablePath : undefined,
    command,
    output,
    success: code === 0,
  };
}

/**
 * Detect available C++ compiler
 */
async function detectCompiler(
  preference?: "clang++" | "g++" | "msvc" | "auto",
): Promise<string> {
  if (preference && preference !== "auto") {
    // Check if preferred compiler exists
    if (await commandExists(preference)) {
      return preference;
    }
    throw new Error(`Compiler ${preference} not found`);
  }

  // Auto-detect compiler
  const compilers = ["clang++", "g++", "cl"];

  for (const compiler of compilers) {
    if (await commandExists(compiler)) {
      return compiler;
    }
  }

  throw new Error("No C++ compiler found. Please install clang++, g++, or MSVC.");
}

/**
 * Check if command exists
 */
async function commandExists(command: string): Promise<boolean> {
  try {
    const process = new Deno.Command(command, {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });
    const { code } = await process.output();
    return code === 0;
  } catch {
    return false;
  }
}

/**
 * Build compiler command
 */
function buildCompilerCommand(
  compiler: string,
  options: {
    source: string;
    output: string;
    standard: string;
    optimization: string;
    debug: boolean;
    includePaths: string[];
    flags: string[];
    linkerFlags: string[];
    libraries: string[];
  },
): string[] {
  const command: string[] = [compiler];

  // Standard
  if (compiler === "cl") {
    command.push(`/std:${options.standard}`);
  } else {
    command.push(`-std=${options.standard}`);
  }

  // Optimization
  if (compiler === "cl") {
    command.push(`/${options.optimization}`);
  } else {
    command.push(`-${options.optimization}`);
  }

  // Debug info
  if (options.debug) {
    if (compiler === "cl") {
      command.push("/Zi");
    } else {
      command.push("-g");
    }
  }

  // Include paths
  for (const includePath of options.includePaths) {
    if (compiler === "cl") {
      command.push(`/I${includePath}`);
    } else {
      command.push("-I", includePath);
    }
  }

  // Warning flags
  if (compiler === "cl") {
    command.push("/W3", "/EHsc");
  } else {
    command.push("-Wall", "-Wextra", "-Wno-unused-parameter");
  }

  // Custom flags
  command.push(...options.flags);

  // Source file
  command.push(options.source);

  // Output file
  if (compiler === "cl") {
    command.push(`/Fe:${options.output}`);
  } else {
    command.push("-o", options.output);
  }

  // Linker flags
  if (options.linkerFlags.length > 0) {
    if (compiler === "cl") {
      command.push("/link", ...options.linkerFlags);
    } else {
      command.push(...options.linkerFlags);
    }
  }

  // Libraries
  for (const lib of options.libraries) {
    if (compiler === "cl") {
      command.push(`${lib}.lib`);
    } else {
      command.push(`-l${lib}`);
    }
  }

  return command;
}

/**
 * Get runtime include path
 */
function getRuntimeIncludePath(customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  // Default to relative path from output
  return "./runtime";
}

/**
 * Get executable extension for platform
 */
function getExecutableExtension(): string {
  return Deno.build.os === "windows" ? ".exe" : "";
}

/**
 * Get base name from file path
 */
function getBaseName(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? "output";
  return fileName.replace(/\.[^.]+$/, "");
}
