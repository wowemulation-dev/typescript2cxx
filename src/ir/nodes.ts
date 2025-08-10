/**
 * Intermediate Representation (IR) nodes for the transpiler
 *
 * The IR serves as a bridge between TypeScript AST and C++ code generation,
 * providing a simplified, C++-oriented representation of the program.
 */

import type { SourceLocation } from "../types.ts";

/**
 * Base interface for all IR nodes
 */
export interface IRNode {
  /** Node type discriminator */
  kind: IRNodeKind;

  /** Source location for error reporting */
  location?: SourceLocation;

  /** Parent node reference */
  parent?: IRNode;

  /** Arbitrary metadata for plugins */
  metadata?: Record<string, unknown>;
}

/**
 * All possible IR node types
 */
export enum IRNodeKind {
  // Program structure
  Program = "Program",
  Module = "Module",
  Namespace = "Namespace",

  // Module declarations
  ImportDeclaration = "ImportDeclaration",
  ExportDeclaration = "ExportDeclaration",
  ExportNamedDeclaration = "ExportNamedDeclaration",
  ExportDefaultDeclaration = "ExportDefaultDeclaration",
  ExportAllDeclaration = "ExportAllDeclaration",
  NamespaceDeclaration = "NamespaceDeclaration",

  // Declarations
  VariableDeclaration = "VariableDeclaration",
  FunctionDeclaration = "FunctionDeclaration",
  ClassDeclaration = "ClassDeclaration",
  InterfaceDeclaration = "InterfaceDeclaration",
  EnumDeclaration = "EnumDeclaration",
  TypeAliasDeclaration = "TypeAliasDeclaration",

  // Decorators
  Decorator = "Decorator",
  DecoratorFactory = "DecoratorFactory",

  // Statements
  BlockStatement = "BlockStatement",
  ExpressionStatement = "ExpressionStatement",
  IfStatement = "IfStatement",
  SwitchStatement = "SwitchStatement",
  WhileStatement = "WhileStatement",
  DoWhileStatement = "DoWhileStatement",
  ForStatement = "ForStatement",
  ForInStatement = "ForInStatement",
  ForOfStatement = "ForOfStatement",
  ReturnStatement = "ReturnStatement",
  BreakStatement = "BreakStatement",
  ContinueStatement = "ContinueStatement",
  ThrowStatement = "ThrowStatement",
  TryStatement = "TryStatement",
  CatchClause = "CatchClause",

  // Expressions
  Identifier = "Identifier",
  Literal = "Literal",
  ArrayExpression = "ArrayExpression",
  ObjectExpression = "ObjectExpression",
  FunctionExpression = "FunctionExpression",
  ArrowFunctionExpression = "ArrowFunctionExpression",
  ClassExpression = "ClassExpression",
  MemberExpression = "MemberExpression",
  OptionalChainingExpression = "OptionalChainingExpression",
  CallExpression = "CallExpression",
  NewExpression = "NewExpression",
  UpdateExpression = "UpdateExpression",
  UnaryExpression = "UnaryExpression",
  BinaryExpression = "BinaryExpression",
  AssignmentExpression = "AssignmentExpression",
  LogicalExpression = "LogicalExpression",
  ConditionalExpression = "ConditionalExpression",
  ThisExpression = "ThisExpression",
  SuperExpression = "SuperExpression",
  TemplateLiteral = "TemplateLiteral",
  TaggedTemplateExpression = "TaggedTemplateExpression",
  YieldExpression = "YieldExpression",
  AwaitExpression = "AwaitExpression",
  SpreadElement = "SpreadElement",

  // Patterns
  ObjectPattern = "ObjectPattern",
  ArrayPattern = "ArrayPattern",
  RestElement = "RestElement",
  AssignmentPattern = "AssignmentPattern",

  // Types
  TypeAnnotation = "TypeAnnotation",
  TypeParameter = "TypeParameter",
  UnionType = "UnionType",
  IntersectionType = "IntersectionType",
  TypeGuard = "TypeGuard",

  // C++ specific
  CppRawExpression = "CppRawExpression",
  SmartPointerExpression = "SmartPointerExpression",
  MoveExpression = "MoveExpression",
}

/**
 * Memory management strategy for pointers
 */
export enum MemoryManagement {
  /** std::shared_ptr<T> */
  Shared = "shared",

  /** std::unique_ptr<T> */
  Unique = "unique",

  /** std::weak_ptr<T> */
  Weak = "weak",

  /** Raw pointer T* */
  Raw = "raw",

  /** Stack value */
  Value = "value",

  /** Auto-determined by analyzer */
  Auto = "auto",
}

/**
 * Access modifiers for class members
 */
export enum AccessModifier {
  Public = "public",
  Private = "private",
  Protected = "protected",
}

/**
 * Variable declaration kinds
 */
export enum VariableKind {
  Const = "const",
  Let = "let",
  Var = "var",
}

/**
 * Base interfaces for node categories
 */
export interface IRStatement extends IRNode {}
export interface IRExpression extends IRNode {}
export interface IRDeclaration extends IRStatement {}
export interface IRPattern extends IRNode {}

/**
 * Program root node
 */
export interface IRProgram extends IRNode {
  kind: IRNodeKind.Program;

  /** All modules in the program */
  modules: IRModule[];

  /** Global includes needed */
  includes: string[];

  /** Entry point module */
  entryModule?: string;
}

/**
 * Module (file) node
 */
export interface IRModule extends IRNode {
  kind: IRNodeKind.Module;

  /** Module name/path */
  name: string;

  /** Module body statements */
  body: IRStatement[];

  /** Exported symbols */
  exports: string[];

  /** Imported modules */
  imports: IRImport[];

  /** Required C++ headers */
  headers: string[];
}

/**
 * Import declaration
 */
export interface IRImport {
  /** Module specifier */
  from: string;

  /** Imported items */
  items: IRImportItem[];

  /** Is namespace import (import * as ns) */
  isNamespace: boolean;

  /** Namespace name for namespace imports */
  namespace?: string;
}

/**
 * Individual import item
 */
export interface IRImportItem {
  /** Imported name */
  imported: string;

  /** Local name (for renamed imports) */
  local: string;

  /** Is type-only import */
  isType: boolean;
}

/**
 * Import declaration node
 */
export interface IRImportDeclaration extends IRDeclaration {
  kind: IRNodeKind.ImportDeclaration;

  /** Module specifier */
  source: string;

  /** Imported items */
  specifiers: IRImportSpecifier[];

  /** Is type-only import */
  isTypeOnly?: boolean;
}

/**
 * Import specifier types
 */
export type IRImportSpecifier =
  | IRImportDefaultSpecifier
  | IRImportNamespaceSpecifier
  | IRNamedImportSpecifier;

/**
 * Default import specifier (import Foo from "module")
 */
export interface IRImportDefaultSpecifier {
  type: "default";
  local: string;
}

/**
 * Namespace import specifier (import * as Foo from "module")
 */
export interface IRImportNamespaceSpecifier {
  type: "namespace";
  local: string;
}

/**
 * Named import specifier (import {Foo} from "module" or import {Foo as Bar} from "module")
 */
export interface IRNamedImportSpecifier {
  type: "named";
  imported: string;
  local: string;
}

/**
 * Export declaration types
 */
export interface IRExportDeclaration extends IRDeclaration {
  kind: IRNodeKind.ExportDeclaration;

  /** The declaration being exported */
  declaration?: IRDeclaration;

  /** Export specifiers for named exports */
  specifiers?: IRExportSpecifier[];

  /** Source module for re-exports */
  source?: string;
}

/**
 * Export named declaration
 */
export interface IRExportNamedDeclaration extends IRDeclaration {
  kind: IRNodeKind.ExportNamedDeclaration;

  /** The declaration being exported */
  declaration?: IRDeclaration;

  /** Export specifiers */
  specifiers: IRExportSpecifier[];

  /** Source module for re-exports */
  source?: string;
}

/**
 * Export default declaration
 */
export interface IRExportDefaultDeclaration extends IRDeclaration {
  kind: IRNodeKind.ExportDefaultDeclaration;

  /** The declaration being exported as default */
  declaration: IRDeclaration | IRExpression;
}

/**
 * Export all declaration (export * from "module")
 */
export interface IRExportAllDeclaration extends IRDeclaration {
  kind: IRNodeKind.ExportAllDeclaration;

  /** Source module */
  source: string;

  /** Exported name for "export * as name from" syntax */
  exported?: string;
}

/**
 * Export specifier
 */
export interface IRExportSpecifier {
  /** Local name being exported */
  local: string;

  /** Exported name (for renamed exports) */
  exported: string;
}

/**
 * Namespace declaration
 */
export interface IRNamespaceDeclaration extends IRDeclaration {
  kind: IRNodeKind.NamespaceDeclaration;

  /** Namespace name */
  name: string;

  /** Namespace body */
  body: IRStatement[];

  /** Is export namespace */
  isExported?: boolean;

  /** Nested namespaces (for dotted notation like A.B.C) */
  nested?: string[];
}

/**
 * Variable declaration
 */
export interface IRVariableDeclaration extends IRDeclaration {
  kind: IRNodeKind.VariableDeclaration;

  /** Variable binding kind */
  declarationKind: "const" | "let" | "var";

  /** Variable declarations */
  declarations: IRVariableDeclarator[];
}

/**
 * Individual variable declarator
 */
export interface IRVariableDeclarator {
  /** Variable name or pattern */
  id: IRIdentifier | IRPattern;

  /** C++ type */
  cppType: string;

  /** Initializer expression */
  init?: IRExpression;

  /** Memory management */
  memory: MemoryManagement;

  /** Is static */
  isStatic?: boolean;

  /** Is extern */
  isExtern?: boolean;
}

/**
 * Template parameter for generic types/functions
 */
export interface IRTemplateParameter {
  /** Parameter name (e.g. "T") */
  name: string;

  /** Constraint type (e.g. "typename", "class", or a specific type) */
  constraint?: string;

  /** Default type */
  defaultType?: string;

  /** Is variadic */
  isVariadic: boolean;

  /** Is const type parameter */
  isConst?: boolean;
}

/**
 * Function declaration
 */
export interface IRFunctionDeclaration extends IRDeclaration {
  kind: IRNodeKind.FunctionDeclaration;

  /** Function name */
  id: IRIdentifier | null;

  /** Parameters */
  params: IRParameter[];

  /** Return type */
  returnType: string;

  /** Function body */
  body: IRBlockStatement;

  /** Is async function */
  isAsync: boolean;

  /** Is generator function */
  isGenerator: boolean;

  /** Is static method */
  isStatic?: boolean;

  /** Decorators */
  decorators?: IRDecorator[];

  /** Is virtual method */
  isVirtual?: boolean;

  /** Is override */
  isOverride?: boolean;

  /** Is const method */
  isConst?: boolean;

  /** Template parameters */
  templateParams?: IRTemplateParameter[];
}

/**
 * Function parameter
 */
export interface IRParameter {
  /** Parameter name */
  name: string;

  /** C++ type */
  type: string;

  /** Default value */
  defaultValue?: IRExpression;

  /** Is optional */
  isOptional: boolean;

  /** Is rest parameter */
  isRest: boolean;

  /** Memory management */
  memory: MemoryManagement;

  /** Decorators */
  decorators?: IRDecorator[];
}

/**
 * Class declaration
 */
export interface IRClassDeclaration extends IRDeclaration {
  kind: IRNodeKind.ClassDeclaration;

  /** Class name */
  id: IRIdentifier;

  /** Base classes */
  superClass?: IRExpression;

  /** Implemented interfaces */
  implements: string[];

  /** Class members */
  members: IRClassMember[];

  /** Is abstract */
  isAbstract: boolean;

  /** Template parameters */
  templateParams?: IRTemplateParameter[];

  /** Decorator metadata */
  decorators?: IRDecoratorMetadata;
}

/**
 * Class member types
 */
export type IRClassMember =
  | IRMethodDefinition
  | IRPropertyDefinition
  | IRConstructor
  | IRAccessorProperty;

/**
 * Method definition
 */
export interface IRMethodDefinition extends IRNode {
  kind: IRNodeKind.FunctionDeclaration;

  /** Method name */
  key: IRIdentifier | IRLiteral;

  /** Method implementation */
  value: IRFunctionDeclaration;

  /** Access modifier */
  accessibility?: "public" | "private" | "protected";

  /** Is static */
  isStatic: boolean;

  /** Is abstract method */
  isAbstract?: boolean;
}

/**
 * Property definition
 */
export interface IRPropertyDefinition extends IRNode {
  kind: IRNodeKind.VariableDeclaration;

  /** Property name */
  key: IRIdentifier | IRLiteral;

  /** Decorators */
  decorators?: IRDecorator[];

  /** Property type */
  type: string;

  /** Initializer */
  value?: IRExpression;

  /** Access modifier */
  accessibility?: "public" | "private" | "protected";

  /** Is static */
  isStatic: boolean;

  /** Is readonly */
  isReadonly: boolean;

  /** Memory management */
  memory: MemoryManagement;

  /** Is JavaScript private field (#field) */
  isPrivateField?: boolean;
}

/**
 * Constructor
 */
export interface IRConstructor extends IRNode {
  kind: IRNodeKind.FunctionDeclaration;

  /** Parameters */
  params: IRParameter[];

  /** Constructor body */
  body: IRBlockStatement;

  /** Initializer list items */
  initializers?: IRMemberInitializer[];
}

/**
 * Member initializer for constructor
 */
export interface IRMemberInitializer {
  /** Member name */
  member: string;

  /** Initializer expression */
  value: IRExpression;
}

/**
 * Accessor property (getter/setter)
 */
export interface IRAccessorProperty extends IRNode {
  kind: IRNodeKind.FunctionDeclaration;

  /** Property name */
  key: IRIdentifier | IRLiteral;

  /** Accessor type */
  type: "get" | "set";

  /** Implementation */
  value: IRFunctionDeclaration;

  /** Access modifier */
  accessibility?: "public" | "private" | "protected";
}

/**
 * Decorator
 */
export interface IRDecorator extends IRNode {
  kind: IRNodeKind.Decorator;

  /** Decorator expression (identifier or call) */
  expression: IRExpression;

  /** Target type */
  targetType: "class" | "method" | "property" | "parameter" | "accessor";

  /** Target name (for members) */
  targetName?: string;

  /** Parameter index (for parameter decorators) */
  parameterIndex?: number;
}

/**
 * Decorator factory call
 */
export interface IRDecoratorFactory extends IRExpression {
  kind: IRNodeKind.DecoratorFactory;

  /** Factory function name */
  name: string;

  /** Factory arguments */
  arguments: IRExpression[];
}

/**
 * Decorator metadata
 */
export interface IRDecoratorMetadata {
  /** Class decorators */
  classDecorators?: IRDecorator[];

  /** Member decorators (property/method name -> decorators) */
  memberDecorators?: Map<string, IRDecorator[]>;

  /** Parameter decorators (method name -> param index -> decorators) */
  parameterDecorators?: Map<string, Map<number, IRDecorator[]>>;

  /** Static member decorators */
  staticDecorators?: Map<string, IRDecorator[]>;
}

/**
 * Block statement
 */
export interface IRBlockStatement extends IRStatement {
  kind: IRNodeKind.BlockStatement;

  /** Statements in the block */
  body: IRStatement[];
}

/**
 * If statement
 */
export interface IRIfStatement extends IRStatement {
  kind: IRNodeKind.IfStatement;

  /** Test condition */
  test: IRExpression;

  /** Then branch */
  consequent: IRStatement;

  /** Else branch */
  alternate?: IRStatement;
}

/**
 * While statement
 */
export interface IRWhileStatement extends IRStatement {
  kind: IRNodeKind.WhileStatement;

  /** Test condition */
  test: IRExpression;

  /** Loop body */
  body: IRStatement;
}

/**
 * For statement
 */
export interface IRForStatement extends IRStatement {
  kind: IRNodeKind.ForStatement;

  /** Initialization */
  init?: IRVariableDeclaration | IRExpression;

  /** Test condition */
  test?: IRExpression;

  /** Update expression */
  update?: IRExpression;

  /** Loop body */
  body: IRStatement;
}

/**
 * For...of statement (iterator-based loop)
 */
export interface IRForOfStatement extends IRStatement {
  kind: IRNodeKind.ForOfStatement;

  /** Loop variable declaration or pattern */
  left: IRVariableDeclaration | IRPattern;

  /** Iterable expression */
  right: IRExpression;

  /** Loop body */
  body: IRStatement;

  /** Is async iteration (for await...of) */
  isAsync?: boolean;
}

/**
 * For...in statement (property enumeration loop)
 */
export interface IRForInStatement extends IRStatement {
  kind: IRNodeKind.ForInStatement;

  /** Loop variable declaration or pattern */
  left: IRVariableDeclaration | IRPattern;

  /** Object to enumerate */
  right: IRExpression;

  /** Loop body */
  body: IRStatement;
}

/**
 * Switch statement
 */
export interface IRSwitchStatement extends IRStatement {
  kind: IRNodeKind.SwitchStatement;

  /** Switch discriminant */
  discriminant: IRExpression;

  /** Switch cases */
  cases: IRSwitchCase[];
}

/**
 * Switch case
 */
export interface IRSwitchCase extends IRNode {
  /** Test value (null for default case) */
  test: IRExpression | null;

  /** Statements for this case */
  consequent: IRStatement[];
}

/**
 * Return statement
 */
export interface IRReturnStatement extends IRStatement {
  kind: IRNodeKind.ReturnStatement;

  /** Return value */
  argument?: IRExpression;
}

/**
 * Break statement
 */
export interface IRBreakStatement extends IRStatement {
  kind: IRNodeKind.BreakStatement;

  /** Optional label */
  label?: string;
}

/**
 * Continue statement
 */
export interface IRContinueStatement extends IRStatement {
  kind: IRNodeKind.ContinueStatement;

  /** Optional label */
  label?: string;
}

/**
 * Expression statement
 */
export interface IRExpressionStatement extends IRStatement {
  kind: IRNodeKind.ExpressionStatement;

  /** Expression */
  expression: IRExpression;
}

/**
 * Identifier
 */
export interface IRIdentifier extends IRExpression {
  kind: IRNodeKind.Identifier;

  /** Identifier name */
  name: string;

  /** Resolved C++ name (may differ due to keywords) */
  cppName?: string;
}

/**
 * Literal value
 */
export interface IRLiteral extends IRExpression {
  kind: IRNodeKind.Literal;

  /** Literal value */
  value: string | number | boolean | null | bigint;

  /** Raw representation */
  raw: string;

  /** Literal type */
  literalType: "string" | "number" | "boolean" | "null" | "bigint" | "regexp";

  /** C++ type for the literal */
  cppType?: string;
}

/**
 * Binary expression
 */
export interface IRBinaryExpression extends IRExpression {
  kind: IRNodeKind.BinaryExpression;

  /** Operator */
  operator: string;

  /** Left operand */
  left: IRExpression;

  /** Right operand */
  right: IRExpression;

  /** C++ operator (may differ from TS) */
  cppOperator?: string;
}

/**
 * Call expression
 */
export interface IRCallExpression extends IRExpression {
  kind: IRNodeKind.CallExpression;

  /** Function being called */
  callee: IRExpression;

  /** Arguments */
  arguments: IRExpression[];

  /** Is optional call (?.) */
  optional: boolean;
}

/**
 * Member expression
 */
export interface IRMemberExpression extends IRExpression {
  kind: IRNodeKind.MemberExpression;

  /** Object */
  object: IRExpression;

  /** Property */
  property: IRExpression;

  /** Is computed (bracket notation) */
  computed: boolean;

  /** Is optional chaining (?.) */
  optional: boolean;
}

/**
 * Optional chaining expression
 */
export interface IROptionalChainingExpression extends IRExpression {
  kind: IRNodeKind.OptionalChainingExpression;

  /** Base expression */
  base: IRExpression;
}

/**
 * Unary expression
 */
export interface IRUnaryExpression extends IRExpression {
  kind: IRNodeKind.UnaryExpression;

  /** Operator */
  operator: string;

  /** Operand */
  operand: IRExpression;

  /** Is prefix operator */
  prefix: boolean;
}

/**
 * Assignment expression
 */
export interface IRAssignmentExpression extends IRExpression {
  kind: IRNodeKind.AssignmentExpression;

  /** Operator (=, +=, -=, etc.) */
  operator: string;

  /** Left-hand side */
  left: IRExpression | IRPattern;

  /** Right-hand side */
  right: IRExpression;
}

/**
 * Conditional expression (ternary)
 */
export interface IRConditionalExpression extends IRExpression {
  kind: IRNodeKind.ConditionalExpression;

  /** Test condition */
  test: IRExpression;

  /** True branch */
  consequent: IRExpression;

  /** False branch */
  alternate: IRExpression;
}

/**
 * Array expression
 */
export interface IRArrayExpression extends IRExpression {
  kind: IRNodeKind.ArrayExpression;

  /** Array elements */
  elements: (IRExpression | null)[];
}

/**
 * Object expression
 */
export interface IRObjectExpression extends IRExpression {
  kind: IRNodeKind.ObjectExpression;

  /** Object properties */
  properties: IRObjectProperty[];
}

/**
 * Object property
 */
export interface IRObjectProperty {
  /** Property key */
  key: IRExpression | IRIdentifier;

  /** Property value */
  value: IRExpression;

  /** Property kind */
  kind: "init" | "get" | "set";

  /** Is method */
  method: boolean;

  /** Is shorthand */
  shorthand: boolean;

  /** Is computed key */
  computed: boolean;
}

/**
 * New expression
 */
export interface IRNewExpression extends IRExpression {
  kind: IRNodeKind.NewExpression;

  /** Constructor being called */
  callee: IRExpression;

  /** Constructor arguments */
  arguments: IRExpression[];
}

/**
 * This expression
 */
export interface IRThisExpression extends IRExpression {
  kind: IRNodeKind.ThisExpression;
}

/**
 * Template literal expression
 */
export interface IRTemplateLiteral extends IRExpression {
  kind: IRNodeKind.TemplateLiteral;

  /** Template parts (literals and expressions) */
  parts: Array<IRExpression | IRLiteral>;
}

/**
 * Interface declaration
 */
export interface IRInterfaceDeclaration extends IRDeclaration {
  kind: IRNodeKind.InterfaceDeclaration;

  /** Interface name */
  id: IRIdentifier;

  /** Extended interfaces */
  extends: string[];

  /** Interface members */
  body: IRInterfaceBody;
}

/**
 * Interface body
 */
export interface IRInterfaceBody {
  /** Interface members */
  body: IRInterfaceMember[];
}

/**
 * Interface member types
 */
export type IRInterfaceMember =
  | IRMethodSignature
  | IRPropertySignature
  | IRIndexSignature;

/**
 * Method signature in interface
 */
export interface IRMethodSignature extends IRNode {
  /** Method name */
  key: IRIdentifier | IRLiteral;

  /** Parameters */
  params: IRParameter[];

  /** Return type */
  returnType: string;

  /** Is optional */
  optional: boolean;
}

/**
 * Property signature in interface
 */
export interface IRPropertySignature extends IRNode {
  /** Property name */
  key: IRIdentifier | IRLiteral;

  /** Property type */
  type: string;

  /** Is optional */
  optional: boolean;

  /** Is readonly */
  readonly: boolean;
}

/**
 * Index signature in interface
 */
export interface IRIndexSignature extends IRNode {
  /** Index parameter name */
  indexName: string;

  /** Index type */
  indexType: string;

  /** Value type */
  valueType: string;

  /** Is readonly */
  readonly: boolean;
}

/**
 * Enum declaration
 */
export interface IREnumDeclaration extends IRDeclaration {
  kind: IRNodeKind.EnumDeclaration;

  /** Enum name */
  id: IRIdentifier;

  /** Enum members */
  members: IREnumMember[];

  /** Is const enum */
  isConst: boolean;
}

/**
 * Enum member
 */
export interface IREnumMember extends IRNode {
  /** Member name */
  id: IRIdentifier;

  /** Member value (optional - auto-incremented if not provided) */
  initializer?: IRExpression;
}

/**
 * Try statement
 */
export interface IRTryStatement extends IRStatement {
  kind: IRNodeKind.TryStatement;

  /** Try block */
  block: IRBlockStatement;

  /** Catch handler */
  handler?: IRCatchClause;

  /** Finally block */
  finalizer?: IRBlockStatement;
}

/**
 * Catch clause
 */
export interface IRCatchClause extends IRNode {
  kind: IRNodeKind.CatchClause;

  /** Exception parameter */
  param?: IRIdentifier;

  /** Exception type */
  exceptionType?: string;

  /** Catch body */
  body: IRBlockStatement;
}

/**
 * Throw statement
 */
export interface IRThrowStatement extends IRStatement {
  kind: IRNodeKind.ThrowStatement;

  /** Expression to throw */
  argument: IRExpression;
}

/**
 * Await expression
 */
export interface IRAwaitExpression extends IRExpression {
  kind: IRNodeKind.AwaitExpression;

  /** Expression to await */
  argument: IRExpression;
}

/**
 * Smart pointer expression (C++ specific)
 */
export interface IRSmartPointerExpression extends IRExpression {
  kind: IRNodeKind.SmartPointerExpression;

  /** Pointer type */
  pointerType: "shared_ptr" | "unique_ptr" | "weak_ptr";

  /** Pointed-to expression */
  expression: IRExpression;

  /** Make function (make_shared, make_unique) */
  makeFunction?: string;
}

/**
 * Union type (T | U)
 */
export interface IRUnionType extends IRNode {
  kind: IRNodeKind.UnionType;

  /** Types in the union */
  types: IRNode[];

  /** C++ wrapper type to generate (e.g., js::typed::StringOrNumber) */
  cppType?: string;
}

/**
 * Intersection type (T & U)
 */
export interface IRIntersectionType extends IRNode {
  kind: IRNodeKind.IntersectionType;

  /** Types in the intersection */
  types: IRNode[];

  /** C++ implementation strategy */
  strategy: "inheritance" | "composition" | "duck_typing";
}

/**
 * Type guard function (val is Type)
 */
export interface IRTypeGuard extends IRExpression {
  kind: IRNodeKind.TypeGuard;

  /** Parameter being checked */
  parameter: IRIdentifier;

  /** Type to guard against */
  guardedType: IRNode;

  /** Guard expression (typeof param === "string") */
  expression: IRExpression;
}

/**
 * Object destructuring pattern
 */
export interface IRObjectPattern extends IRPattern {
  kind: IRNodeKind.ObjectPattern;

  /** Properties to destructure */
  properties: IRObjectPatternProperty[];

  /** C++ type (if known) */
  cppType?: string;
}

/**
 * Object pattern property
 */
export interface IRObjectPatternProperty {
  /** Property key */
  key: IRIdentifier | IRLiteral | IRExpression;

  /** Variable binding or nested pattern */
  value: IRIdentifier | IRPattern;

  /** Is shorthand (e.g., {x} instead of {x: x}) */
  shorthand: boolean;

  /** Is rest property (...rest) */
  rest?: boolean;

  /** Default value for the property */
  defaultValue?: IRExpression;

  /** Renamed property name (for { prop: newName } patterns) */
  renamed?: string;
}

/**
 * Array destructuring pattern
 */
export interface IRArrayPattern extends IRPattern {
  kind: IRNodeKind.ArrayPattern;

  /** Array elements to destructure */
  elements: (IRIdentifier | IRPattern | IRRestElement | null)[];

  /** C++ type (if known) */
  cppType?: string;
}

/**
 * Rest element in destructuring (...rest)
 */
export interface IRRestElement extends IRPattern {
  kind: IRNodeKind.RestElement;

  /** Variable to bind rest elements to */
  argument: IRIdentifier | IRPattern;

  /** C++ type */
  cppType?: string;
}

/**
 * Assignment pattern (default value in destructuring)
 */
export interface IRAssignmentPattern extends IRPattern {
  kind: IRNodeKind.AssignmentPattern;

  /** Variable or pattern */
  left: IRIdentifier | IRPattern;

  /** Default value */
  right: IRExpression;
}

/**
 * Spread element in arrays/calls (...expr)
 */
export interface IRSpreadElement extends IRExpression {
  kind: IRNodeKind.SpreadElement;

  /** Expression to spread */
  argument: IRExpression;
}
