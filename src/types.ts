/**
 * Core types for the TypeScript to C++ transpiler
 */

export interface TranspileOptions {
  /** Source filename for error reporting */
  filename?: string;

  /** Output filename (without extension) */
  outputName?: string;

  /** Enable TSX parsing */
  tsx?: boolean;

  /** C++ standard to target (default: c++20) */
  standard?: "c++17" | "c++20" | "c++23";

  /** Enable source map generation */
  sourceMap?: boolean;

  /** Code readability mode */
  readability?: "default" | "debug" | "minimal" | false;

  /** Optimization level */
  optimization?: "O0" | "O1" | "O2" | "O3" | "Os";

  /** Memory management strategy */
  memoryStrategy?: "auto" | "shared" | "unique" | "manual";

  /** Plugins to apply */
  plugins?: string[];

  /** Additional include paths */
  includePaths?: string[];

  /** Runtime include path (default: "core.h") */
  runtimeInclude?: string;

  /** Custom type mappings */
  typeMappings?: Record<string, string>;

  /** Target platform */
  platform?: "windows" | "linux" | "macos" | "generic";

  /** Enable coroutines for async/await */
  useCoroutines?: boolean;

  /** Enable C++20 modules */
  useModules?: boolean;

  /** Generate reflection metadata */
  generateReflection?: boolean;
}

export interface TranspileResult {
  /** Generated C++ header content */
  header: string;

  /** Generated C++ source content */
  source: string;

  /** Source map (if enabled) */
  sourceMap?: string;

  /** Warnings generated during transpilation */
  warnings: TranspilerWarning[];

  /** Statistics about the transpilation */
  stats: TranspileStats;
}

export interface TranspilerWarning {
  /** Warning code */
  code: string;

  /** Warning message */
  message: string;

  /** Source location */
  location?: SourceLocation;

  /** Severity level */
  severity: "info" | "warning" | "error";
}

export interface SourceLocation {
  /** Source file path */
  file: string;

  /** Line number (1-based) */
  line: number;

  /** Column number (1-based) */
  column: number;

  /** End line (for ranges) */
  endLine?: number;

  /** End column (for ranges) */
  endColumn?: number;
}

export interface TranspileStats {
  /** Number of TypeScript nodes processed */
  nodesProcessed: number;

  /** Number of C++ lines generated */
  linesGenerated: number;

  /** Time taken in milliseconds */
  timeMs: number;

  /** Memory usage in bytes */
  memoryUsed?: number;

  /** Number of types resolved */
  typesResolved: number;

  /** Number of optimizations applied */
  optimizationsApplied: number;
}

export interface FileInput {
  /** File path or module specifier */
  path: string;

  /** File content (if already loaded) */
  content?: string;

  /** Whether this is the main entry point */
  isEntry?: boolean;
}

export interface CompilerContext {
  /** Current options */
  options: TranspileOptions;

  /** Type checker instance */
  typeChecker: TypeChecker;

  /** Current source file being processed */
  currentFile?: string;

  /** Accumulated warnings */
  warnings: TranspilerWarning[];

  /** Statistics collector */
  stats: TranspileStats;

  /** Plugin contexts */
  pluginContexts: Map<string, unknown>;
}

export interface TypeChecker {
  /** Resolve a type from a TypeScript type node */
  resolveType(node: unknown): ResolvedType;

  /** Get symbol information */
  getSymbol(node: unknown): Symbol | undefined;

  /** Check if a type is assignable to another */
  isAssignableTo(source: ResolvedType, target: ResolvedType): boolean;
}

export interface ResolvedType {
  /** Type name in TypeScript */
  name: string;

  /** Mapped C++ type */
  cppType: string;

  /** Type flags */
  flags: TypeFlags;

  /** Generic type arguments */
  typeArguments?: ResolvedType[];

  /** Union/intersection members */
  members?: ResolvedType[];

  /** Symbol information */
  symbol?: Symbol;
}

export interface Symbol {
  /** Symbol name */
  name: string;

  /** Symbol kind */
  kind: SymbolKind;

  /** Declaration location */
  location?: SourceLocation;

  /** Type information */
  type?: ResolvedType;

  /** JSDoc comments */
  documentation?: string[];

  /** Memory annotations */
  memoryAnnotations?: string[];
}

export enum SymbolKind {
  Variable = "variable",
  Function = "function",
  Class = "class",
  Interface = "interface",
  Enum = "enum",
  Module = "module",
  TypeAlias = "typeAlias",
  Property = "property",
  Method = "method",
  Constructor = "constructor",
  Parameter = "parameter",
}

export interface TypeFlags {
  /** Is primitive type */
  isPrimitive: boolean;

  /** Is object type */
  isObject: boolean;

  /** Is array type */
  isArray: boolean;

  /** Is function type */
  isFunction: boolean;

  /** Is generic type */
  isGeneric: boolean;

  /** Is nullable */
  isNullable: boolean;

  /** Is union type */
  isUnion: boolean;

  /** Is intersection type */
  isIntersection: boolean;

  /** Is literal type */
  isLiteral: boolean;

  /** Needs heap allocation */
  needsHeapAllocation: boolean;
}
