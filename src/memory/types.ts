/**
 * Memory management types and interfaces
 */

import type { IRNode } from "../ir/nodes.ts";

/**
 * Memory annotation from JSDoc or decorators
 */
export interface MemoryAnnotation {
  /** Annotation type */
  type: "shared" | "unique" | "weak" | "raw";

  /** Source of annotation */
  source: "jsdoc" | "decorator" | "inferred";

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Memory ownership information
 */
export interface OwnershipInfo {
  /** Node that owns this memory */
  owner?: IRNode;

  /** Ownership type */
  type: OwnershipType;

  /** Lifetime scope */
  scope: LifetimeScope;

  /** Can be moved */
  movable: boolean;

  /** Can be copied */
  copyable: boolean;
}

/**
 * Ownership types
 */
export enum OwnershipType {
  /** Single owner (unique_ptr) */
  Unique = "unique",

  /** Shared ownership (shared_ptr) */
  Shared = "shared",

  /** Non-owning reference (weak_ptr or reference) */
  Weak = "weak",

  /** Borrowed reference (&) */
  Borrowed = "borrowed",

  /** Value type (no indirection) */
  Value = "value",
}

/**
 * Lifetime scope
 */
export enum LifetimeScope {
  /** Function local */
  Local = "local",

  /** Class member */
  Member = "member",

  /** Global/static */
  Global = "global",

  /** Temporary (expression) */
  Temporary = "temporary",
}

/**
 * Result of memory analysis
 */
export interface MemoryAnalysisResult {
  /** Recommended pointer type */
  pointerType: PointerType;

  /** Ownership information */
  ownership: OwnershipInfo;

  /** Potential issues */
  issues: MemoryIssue[];

  /** Suggested fixes */
  suggestions: MemorySuggestion[];

  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Pointer types in C++
 */
export enum PointerType {
  /** std::shared_ptr<T> */
  SharedPtr = "shared_ptr",

  /** std::unique_ptr<T> */
  UniquePtr = "unique_ptr",

  /** std::weak_ptr<T> */
  WeakPtr = "weak_ptr",

  /** T* (raw pointer) */
  RawPtr = "raw",

  /** T& (reference) */
  Reference = "reference",

  /** T (value) */
  Value = "value",
}

/**
 * Memory-related issue
 */
export interface MemoryIssue {
  /** Issue type */
  type: MemoryIssueType;

  /** Issue severity */
  severity: "error" | "warning" | "info";

  /** Issue description */
  message: string;

  /** Affected nodes */
  nodes: IRNode[];
}

/**
 * Types of memory issues
 */
export enum MemoryIssueType {
  /** Circular reference detected */
  CircularReference = "circular_reference",

  /** Potential use after free */
  UseAfterFree = "use_after_free",

  /** Ownership conflict */
  OwnershipConflict = "ownership_conflict",

  /** Missing annotation */
  MissingAnnotation = "missing_annotation",

  /** Incompatible pointer types */
  IncompatiblePointers = "incompatible_pointers",

  /** Unnecessary heap allocation */
  UnnecessaryHeap = "unnecessary_heap",
}

/**
 * Memory management suggestion
 */
export interface MemorySuggestion {
  /** Suggestion type */
  type: "change_pointer" | "add_annotation" | "refactor";

  /** Suggestion description */
  message: string;

  /** Suggested pointer type */
  suggestedPointer?: PointerType;

  /** Code example */
  example?: string;
}

/**
 * Memory analysis context
 */
export interface MemoryContext {
  /** Parent-child relationships */
  parentChildRelations: Map<IRNode, IRNode[]>;

  /** Circular reference chains */
  circularChains: IRNode[][];

  /** Node ownership map */
  ownershipMap: Map<IRNode, OwnershipInfo>;

  /** Lifetime analysis results */
  lifetimes: Map<IRNode, LifetimeScope>;

  /** Move candidates */
  moveCandidates: Set<IRNode>;

  /** Copy operations */
  copyOperations: Map<IRNode, IRNode[]>;
}

/**
 * Configuration for memory analysis
 */
export interface MemoryAnalysisConfig {
  /** Default pointer type when not specified */
  defaultPointerType: PointerType;

  /** Automatically infer weak pointers for parent references */
  inferWeakForParents: boolean;

  /** Use unique_ptr for local variables */
  preferUniqueForLocals: boolean;

  /** Generate move operations where possible */
  enableMoveOptimization: boolean;

  /** Warn on unnecessary heap allocations */
  warnUnnecessaryHeap: boolean;

  /** Heuristic patterns for parent detection */
  parentPatterns: string[];

  /** Heuristic patterns for child detection */
  childPatterns: string[];
}

/**
 * Memory management strategies
 */
export enum MemoryStrategy {
  /** Conservative - prefer shared_ptr */
  Conservative = "conservative",

  /** Aggressive - prefer unique_ptr and moves */
  Aggressive = "aggressive",

  /** Automatic - use heuristics */
  Automatic = "automatic",

  /** Manual - require explicit annotations */
  Manual = "manual",
}
