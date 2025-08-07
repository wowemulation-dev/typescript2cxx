/**
 * CMake generator for TypeScript2Cxx
 * Generates CMakeLists.txt for C++ projects
 */

export interface CMakeOptions {
  projectName: string;
  minimumVersion?: string;
  cppStandard?: string;
  sourceFiles: string[];
  headerFiles: string[];
  includeDirs?: string[];
  libraries?: string[];
  findPackages?: string[];
  executable?: boolean;
  libraryType?: "STATIC" | "SHARED" | "INTERFACE";
  outputName?: string;
}

export class CMakeGenerator {
  private options: Required<CMakeOptions>;

  constructor(options: CMakeOptions) {
    // Use defaults that match typescript2cxx.config.ts
    this.options = {
      minimumVersion: "3.28", // Match config default
      cppStandard: "20",
      includeDirs: [],
      libraries: [],
      findPackages: [],
      executable: true,
      libraryType: "STATIC",
      outputName: options.projectName.toLowerCase(),
      ...options,
    };
  }

  generate(): string {
    const lines: string[] = [];

    // CMake minimum version
    lines.push(`cmake_minimum_required(VERSION ${this.options.minimumVersion})`);
    lines.push(`project(${this.options.projectName})`);
    lines.push("");

    // C++ standard
    lines.push(`# Set C++ standard`);
    lines.push(`set(CMAKE_CXX_STANDARD ${this.options.cppStandard})`);
    lines.push(`set(CMAKE_CXX_STANDARD_REQUIRED ON)`);
    lines.push(`set(CMAKE_CXX_EXTENSIONS OFF)`);
    lines.push("");

    // Compiler flags
    lines.push(`# Compiler flags`);
    lines.push(`if(MSVC)`);
    lines.push(`    add_compile_options(/W4 /WX)`);
    lines.push(`else()`);
    lines.push(`    add_compile_options(-Wall -Wextra -Wpedantic -Werror)`);
    lines.push(`endif()`);
    lines.push("");

    // Find packages
    if (this.options.findPackages.length > 0) {
      lines.push(`# Find required packages`);
      for (const pkg of this.options.findPackages) {
        lines.push(`find_package(${pkg} REQUIRED)`);
      }
      lines.push("");
    }

    // Include directories
    if (this.options.includeDirs.length > 0) {
      lines.push(`# Include directories`);
      lines.push(`include_directories(`);
      for (const dir of this.options.includeDirs) {
        lines.push(`    ${dir}`);
      }
      lines.push(`)`);
      lines.push("");
    }

    // Source files
    lines.push(`# Source files`);
    lines.push(`set(SOURCES`);
    for (const src of this.options.sourceFiles) {
      lines.push(`    ${src}`);
    }
    lines.push(`)`);
    lines.push("");

    // Header files
    if (this.options.headerFiles.length > 0) {
      lines.push(`# Header files`);
      lines.push(`set(HEADERS`);
      for (const hdr of this.options.headerFiles) {
        lines.push(`    ${hdr}`);
      }
      lines.push(`)`);
      lines.push("");
    }

    // Add target
    if (this.options.executable) {
      lines.push(`# Create executable`);
      lines.push(`add_executable(${this.options.outputName} \${SOURCES} \${HEADERS})`);
    } else {
      lines.push(`# Create library`);
      lines.push(
        `add_library(${this.options.outputName} ${this.options.libraryType} \${SOURCES} \${HEADERS})`,
      );
    }
    lines.push("");

    // Link libraries
    if (this.options.libraries.length > 0) {
      lines.push(`# Link libraries`);
      lines.push(`target_link_libraries(${this.options.outputName}`);
      for (const lib of this.options.libraries) {
        lines.push(`    ${lib}`);
      }
      lines.push(`)`);
      lines.push("");
    }

    // Installation rules
    lines.push(`# Installation`);
    if (this.options.executable) {
      lines.push(`install(TARGETS ${this.options.outputName} DESTINATION bin)`);
    } else {
      lines.push(`install(TARGETS ${this.options.outputName} DESTINATION lib)`);
      lines.push(`install(FILES \${HEADERS} DESTINATION include)`);
    }

    return lines.join("\n");
  }
}

/**
 * Generate a CMakeLists.txt file for a transpiled TypeScript project
 */
export function generateCMakeLists(
  projectName: string,
  sourceFiles: string[],
  headerFiles: string[],
  options: Partial<CMakeOptions> = {},
): string {
  const generator = new CMakeGenerator({
    projectName,
    sourceFiles,
    headerFiles,
    ...options,
  });

  return generator.generate();
}
