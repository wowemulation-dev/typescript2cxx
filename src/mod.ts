/**
 * TypeScript to C++20 Transpiler for Deno
 *
 * Transform TypeScript code into high-performance C++20 with smart memory management
 * and JavaScript-compatible runtime types. This transpiler is designed for projects
 * that need native performance while maintaining TypeScript's developer experience.
 *
 * ## Features
 *
 * - Full TypeScript syntax support with TypeScript Compiler API
 * - Smart pointer inference (`unique_ptr`, `shared_ptr`, `weak_ptr`)
 * - JavaScript-compatible runtime types (`js::string`, `js::array`, etc.)
 * - Memory management annotations via JSDoc (`@weak`, `@shared`, `@unique`)
 * - Extensible plugin system for custom transformations
 * - Source map generation for debugging
 *
 * ## Basic Usage
 *
 * ```typescript
 * import { transpile } from "@wowemulation-dev/typescript2cxx";
 *
 * const result = await transpile(`
 *   class Point {
 *     x: number = 42;
 *     display(): void {
 *       console.log(\`Point: \${this.x}\`);
 *     }
 *   }
 * `);
 *
 * console.log(result.header); // Generated C++ header
 * console.log(result.source); // Generated C++ source
 * ```
 *
 * ## Memory Management
 *
 * Control memory management with JSDoc annotations:
 *
 * ```typescript
 * class Node {
 *   /\** @weak *\/
 *   parent?: Node;
 *
 *   /\** @shared *\/
 *   data: Data;
 *
 *   /\** @unique *\/
 *   buffer: Buffer;
 * }
 * ```
 *
 * ## CLI Usage
 *
 * ```bash
 * # Install globally
 * deno install -Arf -n tsc2cxx jsr:@wowemulation-dev/typescript2cxx/cli
 *
 * # Transpile a file
 * tsc2cxx input.ts -o output/
 * ```
 *
 * @module typescript2cxx
 */

/**
 * Transpile TypeScript code to C++
 * @param source - TypeScript source code to transpile
 * @param options - Optional transpilation options
 * @returns Promise resolving to transpilation result with header and source files
 */
export { transpile } from "./transpiler.ts";

/**
 * Transpile a TypeScript file to C++
 * @param filePath - Path to the TypeScript file
 * @param options - Optional transpilation options
 * @returns Promise resolving to transpilation result with header and source files
 */
export { transpileFile } from "./transpiler.ts";

/**
 * Compile TypeScript files to C++ with full project support
 * @param options - Compilation options including input files and output settings
 * @returns Promise resolving when compilation is complete
 */
export { compile } from "./compiler.ts";

/**
 * Compilation options for the compile function
 */
export type { CompileOptions } from "./compiler.ts";

/**
 * Parse TypeScript source code into an AST
 * @param source - TypeScript source code
 * @param options - Optional parsing options
 * @returns Parsed AST with type information
 */
export { parseTypeScript } from "./ast/parser.ts";

/**
 * Generate C++ code from an IR module
 * @param module - Intermediate representation module
 * @param options - Optional code generation options
 * @returns Generated C++ header and source code
 */
export { generateCpp } from "./codegen/generator.ts";

/**
 * Transpilation options
 */
export type { TranspileOptions } from "./types.ts";

/**
 * Transpilation result containing generated C++ code
 */
export type { TranspileResult } from "./types.ts";

/**
 * Intermediate representation types
 */
export type { IRModule, IRNode, IRProgram } from "./ir/nodes.ts";

/**
 * Plugin system types for extending transpiler functionality
 */
export type { Plugin, PluginContext } from "./plugins/types.ts";

/**
 * Memory management annotations for smart pointer control
 */
export type { MemoryAnnotation } from "./memory/types.ts";

/**
 * Memory management strategies enum
 */
export { MemoryManagement } from "./ir/nodes.ts";

/**
 * Type guards for IR nodes - provides type-safe narrowing
 */
export * from "./ir/type-guards.ts";

/**
 * Branded types for code generation - provides type-safe code strings
 */
export type {
  CppCode,
  CppHeaderCode,
  CppSourceCode,
  TypeScriptCode,
} from "./codegen/types.ts";

export {
  concatCppCode,
  cpp,
  indentCppCode,
  isCppCode,
  isTypeScriptCode,
  joinCppCode,
  toCppCode,
  toCppHeaderCode,
  toCppSourceCode,
  toTypeScriptCode,
  ts,
} from "./codegen/types.ts";

/**
 * Exhaustive switch checks - ensures all cases are handled
 */
export {
  assertNever,
  assertUnreachable,
  createAssertNever,
  exhaustiveCheck,
  ExhaustivenessValidator,
  isNever,
} from "./utils/assert-never.ts";

export type { ExhaustiveCheck } from "./utils/assert-never.ts";

/**
 * Transpiler error types
 */
export { CodeGenError, ParseError, TranspilerError } from "./errors.ts";

/**
 * Current version of typescript2cxx
 */
export const VERSION = "0.7.0";
