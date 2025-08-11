/**
 * Code generation context and interfaces
 */

import type { ErrorReporter } from "../errors.ts";
import type { SourceLocation } from "../types.ts";
import type { StatementGenerator } from "./generators/statement-generator.ts";
import type { TypeMapper } from "./generators/type-mapper.ts";

/**
 * Code generation context passed through generation methods
 */
export interface CodeGenContext {
  /** Current indentation level */
  indentLevel: number;
  
  /** Whether generating header or source file */
  inHeader: boolean;
  
  /** Current class name (when generating class members) */
  className?: string;
  
  /** Required includes to add to the file */
  requiredIncludes?: Set<string>;
  
  /** Forward declarations needed */
  forwardDeclarations?: Set<string>;
  
  /** Error reporter for warnings and errors */
  errorReporter?: ErrorReporter;
  
  /** Statement generator (for circular dependency) */
  statementGenerator?: StatementGenerator;
  
  /** Type mapper utility */
  typeMapper: TypeMapper;
  
  /** Don't add semicolon (for special contexts like for loops) */
  noSemicolon?: boolean;
  
  /** Track generated code for source maps */
  sourceMapGenerator?: {
    addMapping(mapping: {
      generated: { line: number; column: number };
      original?: { line: number; column: number };
      source?: string;
      name?: string;
    }): void;
  };
}