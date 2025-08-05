/**
 * Error types for the TypeScript to C++ transpiler
 */

import type { SourceLocation } from "./types.ts";

/**
 * Base error class for all transpiler errors
 */
export class TranspilerError extends Error {
  constructor(
    message: string,
    public code: string,
    public location?: SourceLocation,
  ) {
    super(message);
    this.name = "TranspilerError";
  }

  /**
   * Format error with location information
   */
  override toString(): string {
    if (this.location) {
      return `${this.location.file}:${this.location.line}:${this.location.column} - ${this.code}: ${this.message}`;
    }
    return `${this.code}: ${this.message}`;
  }
}

/**
 * Error thrown during TypeScript parsing
 */
export class ParseError extends TranspilerError {
  constructor(message: string, location?: SourceLocation) {
    super(message, "PARSE_ERROR", location);
    this.name = "ParseError";
  }
}

/**
 * Error thrown during code generation
 */
export class CodeGenError extends TranspilerError {
  constructor(message: string, location?: SourceLocation) {
    super(message, "CODEGEN_ERROR", location);
    this.name = "CodeGenError";
  }
}

/**
 * Error thrown when a TypeScript feature is not supported
 */
export class UnsupportedFeatureError extends TranspilerError {
  constructor(
    public feature: string,
    location?: SourceLocation,
  ) {
    super(`Unsupported TypeScript feature: ${feature}`, "UNSUPPORTED_FEATURE", location);
    this.name = "UnsupportedFeatureError";
  }
}

/**
 * Error thrown during type resolution
 */
export class TypeResolutionError extends TranspilerError {
  constructor(
    message: string,
    public typeName?: string,
    location?: SourceLocation,
  ) {
    super(message, "TYPE_ERROR", location);
    this.name = "TypeResolutionError";
  }
}

/**
 * Error thrown for circular dependencies
 */
export class CircularDependencyError extends TranspilerError {
  constructor(
    public cycle: string[],
    location?: SourceLocation,
  ) {
    super(
      `Circular dependency detected: ${cycle.join(" -> ")}`,
      "CIRCULAR_DEPENDENCY",
      location,
    );
    this.name = "CircularDependencyError";
  }
}

/**
 * Error thrown for memory management issues
 */
export class MemoryManagementError extends TranspilerError {
  constructor(
    message: string,
    public hint?: string,
    location?: SourceLocation,
  ) {
    super(message, "MEMORY_ERROR", location);
    this.name = "MemoryManagementError";
  }
}

/**
 * Error thrown by plugins
 */
export class PluginError extends TranspilerError {
  constructor(
    public pluginName: string,
    message: string,
    location?: SourceLocation,
  ) {
    super(`Plugin "${pluginName}": ${message}`, "PLUGIN_ERROR", location);
    this.name = "PluginError";
  }
}

/**
 * Error codes used throughout the transpiler
 */
export enum ErrorCode {
  // Parse errors
  PARSE_ERROR = "TSC001",
  SYNTAX_ERROR = "TSC002",
  INVALID_TOKEN = "TSC003",

  // Type errors
  TYPE_ERROR = "TSC101",
  TYPE_NOT_FOUND = "TSC102",
  TYPE_MISMATCH = "TSC103",
  GENERIC_CONSTRAINT_FAILED = "TSC104",

  // Feature errors
  UNSUPPORTED_FEATURE = "TSC201",
  DEPRECATED_FEATURE = "TSC202",
  EXPERIMENTAL_FEATURE = "TSC203",

  // Code generation errors
  CODEGEN_ERROR = "TSC301",
  INVALID_CPP_IDENTIFIER = "TSC302",
  TEMPLATE_ERROR = "TSC303",

  // Memory errors
  MEMORY_ERROR = "TSC401",
  CIRCULAR_REFERENCE = "TSC402",
  OWNERSHIP_CONFLICT = "TSC403",

  // Plugin errors
  PLUGIN_ERROR = "TSC501",
  PLUGIN_NOT_FOUND = "TSC502",
  PLUGIN_INIT_FAILED = "TSC503",

  // System errors
  FILE_NOT_FOUND = "TSC601",
  IO_ERROR = "TSC602",
  INTERNAL_ERROR = "TSC666",
}

/**
 * Helper class for formatting and reporting errors
 */
export class ErrorReporter {
  private errors: TranspilerError[] = [];
  private warnings: TranspilerError[] = [];

  /**
   * Report an error
   */
  error(error: TranspilerError): void {
    this.errors.push(error);
  }

  /**
   * Report a warning
   */
  warning(warning: TranspilerError): void {
    this.warnings.push(warning);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get all errors
   */
  getErrors(): ReadonlyArray<TranspilerError> {
    return this.errors;
  }

  /**
   * Get all warnings
   */
  getWarnings(): ReadonlyArray<TranspilerError> {
    return this.warnings;
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Format all errors for display
   */
  formatErrors(): string {
    return this.errors.map((e) => e.toString()).join("\n");
  }
}
