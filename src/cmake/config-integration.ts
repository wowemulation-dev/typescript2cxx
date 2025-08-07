/**
 * CMake generator with typescript2cxx config integration
 */

import type { TranspilerConfig } from "../config/types.ts";
import { CMakeGenerator, type CMakeOptions } from "./generator.ts";

/**
 * Generate CMakeLists.txt from transpiler configuration
 */
export function generateCMakeFromConfig(
  config: TranspilerConfig,
  sourceFiles: string[],
  headerFiles: string[],
): string | null {
  // Check if CMake generation is enabled
  if (!config.integration?.cmake?.generate) {
    return null;
  }

  const cmakeConfig = config.integration.cmake;
  const targetConfig = config.target;

  // Build CMake options from config
  const options: CMakeOptions = {
    projectName: cmakeConfig.projectName,
    minimumVersion: cmakeConfig.minimumVersion,
    cppStandard: extractCppStandard(targetConfig?.standard),
    sourceFiles,
    headerFiles,
    includeDirs: buildIncludeDirs(config),
    libraries: buildLibraries(config),
    findPackages: cmakeConfig.findPackages || [],
    executable: determineExecutable(config),
    outputName: inferOutputName(config, cmakeConfig.projectName),
  };

  const generator = new CMakeGenerator(options);
  let content = generator.generate();

  // Add custom commands if specified
  if (cmakeConfig.customCommands && cmakeConfig.customCommands.length > 0) {
    content += "\n\n# Custom commands\n";
    content += cmakeConfig.customCommands.join("\n");
  }

  return content;
}

/**
 * Extract C++ standard number from config
 */
function extractCppStandard(standard?: string): string {
  if (!standard) return "20";

  // Extract number from "c++20" format
  const match = standard.match(/c\+\+(\d+)/);
  return match ? match[1] : "20";
}

/**
 * Build include directories from config
 */
function buildIncludeDirs(config: TranspilerConfig): string[] {
  const dirs: string[] = [];

  // Add current directory
  dirs.push(".");

  // Add runtime includes
  if (config.runtime?.includes) {
    // Extract directory paths from includes like "<typescript2cxx/runtime.hpp>"
    for (const include of config.runtime.includes) {
      const match = include.match(/<(.+)\//);
      if (match) {
        dirs.push(match[1]);
      }
    }
  }

  // Add output structure directories
  if (config.emit?.outputStructure) {
    if (config.emit.outputStructure.headers) {
      dirs.push(config.emit.outputStructure.headers);
    }
  }

  return [...new Set(dirs)]; // Remove duplicates
}

/**
 * Build libraries list from config
 */
function buildLibraries(config: TranspilerConfig): string[] {
  const libs: string[] = [];

  // Add runtime library if specified
  if (config.runtime?.library) {
    libs.push(config.runtime.library);
  }

  // Add thread support if enabled
  if (config.runtime?.features?.threads) {
    libs.push("pthread");
  }

  // Add math library for numeric operations
  libs.push("m");

  // Add standard libraries based on compiler
  if (config.target?.stdlib === "libc++") {
    libs.push("c++");
  } else if (config.target?.stdlib === "libstdc++") {
    libs.push("stdc++");
  }

  return libs;
}

/**
 * Determine if output should be executable or library
 */
function determineExecutable(config: TranspilerConfig): boolean {
  // Check if any entry point is defined as "main"
  if (config.project?.entry) {
    return Object.keys(config.project.entry).includes("main");
  }

  // Default to executable
  return true;
}

/**
 * Infer output name from config
 */
function inferOutputName(config: TranspilerConfig, projectName: string): string {
  // Check for main entry point
  if (config.project?.entry?.main) {
    const mainFile = config.project.entry.main;
    const basename = mainFile.split("/").pop()?.replace(/\.[^.]+$/, "");
    if (basename) return basename;
  }

  // Use project name as fallback
  return projectName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

/**
 * Create compiler-specific settings in CMake
 */
export function generateCompilerSettings(config: TranspilerConfig): string {
  const lines: string[] = [];

  // Compiler-specific flags
  if (config.target?.compiler) {
    lines.push(`# Compiler-specific settings`);

    switch (config.target.compiler) {
      case "gcc":
        lines.push(`if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")`);
        lines.push(`    # GCC specific flags`);
        if (config.compilation?.optimization?.level) {
          lines.push(`    add_compile_options(-${config.compilation.optimization.level})`);
        }
        lines.push(`endif()`);
        break;

      case "clang++":
        lines.push(`if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")`);
        lines.push(`    # Clang specific flags`);
        if (config.target.stdlib === "libc++") {
          lines.push(`    add_compile_options(-stdlib=libc++)`);
          lines.push(`    add_link_options(-stdlib=libc++)`);
        }
        lines.push(`endif()`);
        break;

      case "msvc":
        lines.push(`if(MSVC)`);
        lines.push(`    # MSVC specific flags`);
        lines.push(
          `    add_compile_options(/std:c++${extractCppStandard(config.target.standard)})`,
        );
        lines.push(`endif()`);
        break;
    }
  }

  // Runtime features
  if (config.runtime?.features) {
    lines.push(``);
    lines.push(`# Runtime features`);

    if (!config.runtime.features.exceptions) {
      lines.push(`add_compile_options(-fno-exceptions)`);
    }

    if (!config.runtime.features.rtti) {
      lines.push(`add_compile_options(-fno-rtti)`);
    }

    if (config.runtime.features.coroutines) {
      lines.push(`add_compile_options(-fcoroutines)`);
    }
  }

  return lines.join("\n");
}
