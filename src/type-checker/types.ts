/**
 * Type definitions for the TypeScript type checker integration
 */

import type ts from "typescript";

/**
 * Options for the type checker
 */
export interface TypeCheckerOptions {
  /** TypeScript compiler options */
  compilerOptions?: ts.CompilerOptions;

  /** Include default TypeScript lib files */
  includeDefaultLib?: boolean;

  /** Custom type mappings */
  typeMappings?: Record<string, string>;

  /** Additional type definition files */
  typeDefinitions?: string[];
}

/**
 * Resolved type information
 */
export interface ResolvedType {
  /** TypeScript type name */
  name: string;

  /** Mapped C++ type */
  cppType: string;

  /** Type flags */
  flags: TypeFlags;

  /** Memory management hint from JSDoc */
  memoryHint?: string;

  /** Type arguments for generic types */
  typeArguments?: ResolvedType[];

  /** Members for object types */
  members?: Map<string, ResolvedType>;

  /** Call signatures for function types */
  callSignatures?: CallSignature[];
}

/**
 * Type flags
 */
export interface TypeFlags {
  /** Is primitive type (string, number, boolean) */
  isPrimitive: boolean;

  /** Is object type */
  isObject: boolean;

  /** Is array type */
  isArray: boolean;

  /** Is function type */
  isFunction: boolean;

  /** Is generic type parameter */
  isGeneric: boolean;

  /** Can be null or undefined */
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

/**
 * Function call signature
 */
export interface CallSignature {
  /** Parameters */
  parameters: ParameterInfo[];

  /** Return type */
  returnType: ResolvedType;
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  /** Parameter name */
  name: string;

  /** Parameter type */
  type: ResolvedType;

  /** Is optional */
  optional: boolean;
}

/**
 * Type check result
 */
export interface TypeCheckResult {
  /** Has type errors */
  hasErrors: boolean;

  /** Type errors */
  errors: TypeCheckError[];

  /** TypeScript program */
  program: ts.Program;

  /** TypeScript type checker */
  checker: ts.TypeChecker;
}

/**
 * Type check error
 */
export interface TypeCheckError {
  /** Error code */
  code: number;

  /** Error message */
  message: string;

  /** Error location */
  location?: {
    file: string;
    line: number;
    column: number;
  };
}
