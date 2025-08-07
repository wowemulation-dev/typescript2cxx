/**
 * Compiler module for compiling generated C++ code
 */

import { transpileFile } from "./transpiler.ts";
import type { TranspileOptions } from "./types.ts";
import { generateCMakeLists } from "./cmake/generator.ts";
import { basename, join } from "jsr:@std/path@1";

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

  /** Generate CMakeLists.txt */
  generateCMake?: boolean;

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

  /** Generated CMakeLists.txt path (if generated) */
  cmakeListsPath?: string;

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

  // Generate CMakeLists.txt if requested
  let cmakeListsPath: string | undefined;
  if (options.generateCMake && !options.dryRun) {
    cmakeListsPath = await generateCMakeListsFile(
      outputDir,
      baseName,
      [basename(sourcePath)],
      [basename(headerPath)],
      options,
    );

    if (options.verbose) {
      console.log(`Generated ${cmakeListsPath}`);
    }
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
      cmakeListsPath,
      executablePath: compileResult.executablePath,
      command: compileResult.command,
      output: compileResult.output,
      success: compileResult.success,
    };
  }

  return {
    headerPath,
    sourcePath,
    cmakeListsPath,
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

/**
 * Generate CMakeLists.txt file for the project
 */
async function generateCMakeListsFile(
  outputDir: string,
  projectName: string,
  sourceFiles: string[],
  headerFiles: string[],
  options: CompileOptions,
): Promise<string> {
  const cmakeListsPath = join(outputDir, "CMakeLists.txt");

  // Build CMake options from compile options
  const cmakeOptions = {
    projectName: projectName.replace(/[^a-zA-Z0-9_]/g, "_"), // Make project name safe
    cppStandard: extractCppStandard(options.standard ?? "c++20"),
    sourceFiles,
    headerFiles,
    includeDirs: [
      ".", // Current directory
      ...(options.includePaths ?? []),
      getRuntimeIncludePath(options.runtimePath),
    ].filter((path): path is string => path !== undefined),
    libraries: [
      ...(options.libraries ?? []),
      "m", // Math library
    ],
    executable: true, // Always generate executable for now
    outputName: projectName.toLowerCase(),
  };

  // Generate debug/release configurations
  const cmakeContent = generateCMakeLists(
    cmakeOptions.projectName,
    cmakeOptions.sourceFiles,
    cmakeOptions.headerFiles,
    cmakeOptions,
  );

  // Add debug/release build configurations
  const enhancedContent = cmakeContent + `

# Build configurations
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Debug configuration
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -DDEBUG")

# Release configuration  
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")

# RelWithDebInfo configuration
set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "-O2 -g -DNDEBUG")

# MinSizeRel configuration
set(CMAKE_CXX_FLAGS_MINSIZEREL "-Os -DNDEBUG")

# Print build type
message(STATUS "Build type: \${CMAKE_BUILD_TYPE}")
`;

  await Deno.writeTextFile(cmakeListsPath, enhancedContent);
  return cmakeListsPath;
}

/**
 * Extract C++ standard number from string like "c++20"
 */
function extractCppStandard(standard: string): string {
  const match = standard.match(/(\d+)/);
  return match ? match[1] : "20";
}
