/**
 * Plugin system types for extending the transpiler
 */

import type { IRNode } from "../ir/nodes.ts";
import type { CompilerContext, TranspileOptions } from "../types.ts";

// Re-export IRNode
export type { IRNode };

/**
 * Plugin interface
 */
export interface Plugin {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin description */
  description?: string;

  /** Type mappings provided by the plugin */
  typeMappings?: TypeMappings;

  /** AST/IR transformers */
  transformers?: Transformer[];

  /** Custom code emitters */
  emitters?: CustomEmitter[];

  /** Lifecycle hooks */
  onInit?: (context: PluginContext) => Promise<void> | void;
  onBeforeTransform?: (ast: unknown, context: PluginContext) => Promise<void> | void;
  onAfterTransform?: (code: string, context: PluginContext) => Promise<string> | string;
  onComplete?: (context: PluginContext) => Promise<void> | void;

  /** Plugin configuration schema */
  configSchema?: ConfigSchema;

  /** Default configuration */
  defaultConfig?: Record<string, unknown>;
}

/**
 * Type mapping configuration
 */
export interface TypeMappings {
  /** Simple type name mappings */
  simple?: Record<string, string>;

  /** Complex type mapping functions */
  complex?: TypeMapper[];

  /** Override built-in type mappings */
  overrides?: Record<string, string>;
}

/**
 * Type mapping function
 */
export type TypeMapper = (
  type: TypeInfo,
  context: TypeMappingContext,
) => string | null;

/**
 * Type information for mapping
 */
export interface TypeInfo {
  /** TypeScript type name */
  typeName: string;

  /** Type arguments (for generics) */
  typeArguments?: string[];

  /** Is nullable */
  isNullable: boolean;

  /** Is array type */
  isArray: boolean;

  /** Is union type */
  isUnion: boolean;

  /** Union members (if union) */
  unionMembers?: TypeInfo[];

  /** Original AST node */
  node?: unknown;
}

/**
 * Context for type mapping
 */
export interface TypeMappingContext {
  /** Current file */
  file: string;

  /** Compiler options */
  options: TranspileOptions;

  /** Get mapped type recursively */
  mapType: (type: TypeInfo) => string;

  /** Check if type exists */
  hasType: (name: string) => boolean;
}

/**
 * AST/IR transformer
 */
export interface Transformer {
  /** Transformer name */
  name: string;

  /** Node types to transform */
  nodeKinds: string[];

  /** Transform priority (higher = earlier) */
  priority?: number;

  /** Transform function */
  transform: TransformFunction;
}

/**
 * Transform function
 */
export type TransformFunction = (
  node: IRNode,
  context: TransformContext,
) => IRNode | IRNode[] | null;

/**
 * Transform context
 */
export interface TransformContext {
  /** Parent node */
  parent?: IRNode;

  /** Compiler context */
  compiler: CompilerContext;

  /** Visit child nodes */
  visitChildren: (node: IRNode) => void;

  /** Replace node */
  replaceNode: (oldNode: IRNode, newNode: IRNode) => void;

  /** Add import */
  addImport: (module: string, items: string[]) => void;

  /** Add helper code */
  addHelper: (name: string, code: string) => void;

  /** Current class name (if in class) */
  currentClass?: string;

  /** Current function name (if in function) */
  currentFunction?: string;
}

/**
 * Custom code emitter
 */
export interface CustomEmitter {
  /** Emitter name */
  name: string;

  /** Node types to emit */
  nodeKinds: string[];

  /** Emit priority (higher = earlier) */
  priority?: number;

  /** Emit function */
  emit: EmitFunction;
}

/**
 * Emit function
 */
export type EmitFunction = (
  node: IRNode,
  context: EmitContext,
) => string | null;

/**
 * Emit context
 */
export interface EmitContext {
  /** Indent level */
  indent: number;

  /** Generate indentation */
  getIndent: () => string;

  /** Emit child node */
  emit: (node: IRNode) => string;

  /** Emit multiple nodes */
  emitAll: (nodes: IRNode[], separator?: string) => string;

  /** Add include */
  addInclude: (header: string) => void;

  /** Add forward declaration */
  addForwardDeclaration: (declaration: string) => void;

  /** Current namespace */
  namespace?: string;

  /** Compiler options */
  options: TranspileOptions;
}

/**
 * Plugin context provided to lifecycle hooks
 */
export interface PluginContext {
  /** Plugin name */
  pluginName: string;

  /** Plugin configuration */
  config: Record<string, unknown>;

  /** Transpiler instance */
  transpiler: TranspilerAccess;

  /** Logger */
  logger: Logger;

  /** Compiler options */
  options: TranspileOptions;

  /** Plugin storage (persists across hooks) */
  storage: Map<string, unknown>;
}

/**
 * Access to transpiler internals
 */
export interface TranspilerAccess {
  /** Add type mapping */
  addTypeMapping: (from: string, to: string) => void;

  /** Add transformer */
  addTransformer: (transformer: Transformer) => void;

  /** Add emitter */
  addEmitter: (emitter: CustomEmitter) => void;

  /** Get IR tree */
  getIR: () => IRNode;

  /** Code emission utilities */
  emit: {
    addInclude: (header: string) => void;
    addHelper: (name: string, code: string) => void;
    addForwardDeclaration: (declaration: string) => void;
  };
}

/**
 * Plugin logger
 */
export interface Logger {
  /** Log debug message */
  debug: (message: string) => void;

  /** Log info message */
  info: (message: string) => void;

  /** Log warning */
  warn: (message: string) => void;

  /** Log error */
  error: (message: string) => void;
}

/**
 * Configuration schema for plugin options
 */
export interface ConfigSchema {
  /** Schema type (for validation) */
  type: "object";

  /** Property schemas */
  properties: Record<string, PropertySchema>;

  /** Required properties */
  required?: string[];

  /** Additional properties allowed */
  additionalProperties?: boolean;
}

/**
 * Property schema
 */
export interface PropertySchema {
  /** Property type */
  type: "string" | "number" | "boolean" | "array" | "object";

  /** Property description */
  description?: string;

  /** Default value */
  default?: unknown;

  /** Enum values (for string) */
  enum?: string[];

  /** Minimum value (for number) */
  minimum?: number;

  /** Maximum value (for number) */
  maximum?: number;

  /** Array items schema */
  items?: PropertySchema;

  /** Object properties (for nested objects) */
  properties?: Record<string, PropertySchema>;
}

/**
 * Plugin manifest for discovery
 */
export interface PluginManifest {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin description */
  description: string;

  /** Main entry point */
  main: string;

  /** Compatible transpiler versions */
  engines: {
    typescript2cxx: string;
  };

  /** Dependencies on other plugins */
  dependencies?: Record<string, string>;

  /** Plugin keywords */
  keywords?: string[];

  /** Plugin author */
  author?: string;

  /** Plugin license */
  license?: string;
}

/**
 * Plugin loader interface
 */
export interface PluginLoader {
  /** Load plugin from path or package */
  load(nameOrPath: string): Promise<Plugin>;

  /** Discover available plugins */
  discover(): Promise<PluginManifest[]>;

  /** Validate plugin */
  validate(plugin: Plugin): ValidationResult;
}

/**
 * Plugin validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}
