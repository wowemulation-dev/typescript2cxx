/**
 * TypeScript to C++20 Transpiler for Deno
 *
 * @module typescript2cxx
 */

export { transpile, transpileFile } from "./transpiler.ts";
export { compile } from "./compiler.ts";
export type { CompileOptions } from "./compiler.ts";
export { parseTypeScript } from "./ast/parser.ts";
export { generateCpp } from "./codegen/generator.ts";

// Export types
export type { TranspileOptions, TranspileResult } from "./types.ts";
export type { IRModule, IRNode, IRProgram } from "./ir/nodes.ts";
export type { Plugin, PluginContext } from "./plugins/types.ts";
export type { MemoryAnnotation } from "./memory/types.ts";
export { MemoryManagement } from "./ir/nodes.ts";

// Export errors
export { CodeGenError, ParseError, TranspilerError } from "./errors.ts";

// Version
export const VERSION = "0.1.0";
