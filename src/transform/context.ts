/**
 * Transform context and interfaces for AST to IR transformation
 */

import type { SimpleTypeChecker } from "../type-checker/simple-checker.ts";
import type { CompilerContext, SourceLocation } from "../types.ts";
import type { Plugin } from "../plugins/types.ts";
import type { ErrorReporter } from "../errors.ts";

/**
 * Transform context passed through transformation methods
 */
export interface TransformContext {
  /** Current file being transformed */
  filename?: string;

  /** Source code being transformed */
  source?: string;

  /** Compiler context */
  compilerContext: CompilerContext;

  /** Active plugins */
  plugins: Plugin[];

  /** Error reporter */
  errorReporter: ErrorReporter;

  /** Type checker for type resolution */
  typeChecker: SimpleTypeChecker;

  /** Current scope depth */
  scopeDepth: number;

  /** Variable declarations in current scope */
  scopeVariables: Set<string>;
}