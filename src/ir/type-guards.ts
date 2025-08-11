/**
 * Type guards for IR nodes
 *
 * These type guards provide type-safe narrowing for IR nodes,
 * enabling better type checking and eliminating the need for
 * explicit type assertions throughout the codebase.
 */

import type {
  IRArrayExpression,
  IRArrayPattern,
  IRArrowFunctionExpression,
  IRAssignmentExpression,
  IRAssignmentPattern,
  IRAwaitExpression,
  IRBinaryExpression,
  IRBlockStatement,
  IRBreakStatement,
  IRCallExpression,
  IRCatchClause,
  IRClassDeclaration,
  IRClassExpression,
  IRClassMember,
  IRConditionalExpression,
  IRContinueStatement,
  IRCppRawExpression,
  IRDeclaration,
  IRDecorator,
  IRDecoratorFactory,
  IRDoWhileStatement,
  IREnumDeclaration,
  IRExportAllDeclaration,
  IRExportDeclaration,
  IRExportDefaultDeclaration,
  IRExportNamedDeclaration,
  IRExpression,
  IRExpressionStatement,
  IRForInStatement,
  IRForOfStatement,
  IRForStatement,
  IRFunctionDeclaration,
  IRFunctionExpression,
  IRIdentifier,
  IRIfStatement,
  IRImportDeclaration,
  IRInterfaceDeclaration,
  IRIntersectionType,
  IRLiteral,
  IRLogicalExpression,
  IRMemberExpression,
  IRModule,
  IRMoveExpression,
  IRNamespace,
  IRNamespaceDeclaration,
  IRNewExpression,
  IRNode,
  IRObjectExpression,
  IRObjectPattern,
  IROptionalChainingExpression,
  IRProgram,
  IRRestElement,
  IRReturnStatement,
  IRSmartPointerExpression,
  IRSpreadElement,
  IRStatement,
  IRSuperExpression,
  IRSwitchCase,
  IRSwitchStatement,
  IRTaggedTemplateExpression,
  IRTemplateLiteral,
  IRThisExpression,
  IRThrowStatement,
  IRTryStatement,
  IRTypeAliasDeclaration,
  IRTypeAnnotation,
  IRTypeGuard,
  IRTypeParameter,
  IRUnaryExpression,
  IRUnionType,
  IRUpdateExpression,
  IRVariableDeclaration,
  IRWhileStatement,
  IRYieldExpression,
} from "./nodes.ts";
import { IRNodeKind } from "./nodes.ts";

// ============================================================================
// Program Structure Guards
// ============================================================================

export function isIRProgram(node: IRNode): node is IRProgram {
  return node.kind === IRNodeKind.Program;
}

export function isIRModule(node: IRNode): node is IRModule {
  return node.kind === IRNodeKind.Module;
}

export function isIRNamespace(node: IRNode): node is IRNamespace {
  return node.kind === IRNodeKind.Namespace;
}

// ============================================================================
// Module Declaration Guards
// ============================================================================

export function isIRImportDeclaration(node: IRNode): node is IRImportDeclaration {
  return node.kind === IRNodeKind.ImportDeclaration;
}

export function isIRExportDeclaration(node: IRNode): node is IRExportDeclaration {
  return node.kind === IRNodeKind.ExportDeclaration;
}

export function isIRExportNamedDeclaration(node: IRNode): node is IRExportNamedDeclaration {
  return node.kind === IRNodeKind.ExportNamedDeclaration;
}

export function isIRExportDefaultDeclaration(node: IRNode): node is IRExportDefaultDeclaration {
  return node.kind === IRNodeKind.ExportDefaultDeclaration;
}

export function isIRExportAllDeclaration(node: IRNode): node is IRExportAllDeclaration {
  return node.kind === IRNodeKind.ExportAllDeclaration;
}

export function isIRNamespaceDeclaration(node: IRNode): node is IRNamespaceDeclaration {
  return node.kind === IRNodeKind.NamespaceDeclaration;
}

// ============================================================================
// Declaration Guards
// ============================================================================

export function isIRVariableDeclaration(node: IRNode): node is IRVariableDeclaration {
  return node.kind === IRNodeKind.VariableDeclaration;
}

export function isIRFunctionDeclaration(node: IRNode): node is IRFunctionDeclaration {
  return node.kind === IRNodeKind.FunctionDeclaration;
}

export function isIRClassDeclaration(node: IRNode): node is IRClassDeclaration {
  return node.kind === IRNodeKind.ClassDeclaration;
}

export function isIRInterfaceDeclaration(node: IRNode): node is IRInterfaceDeclaration {
  return node.kind === IRNodeKind.InterfaceDeclaration;
}

export function isIREnumDeclaration(node: IRNode): node is IREnumDeclaration {
  return node.kind === IRNodeKind.EnumDeclaration;
}

export function isIRTypeAliasDeclaration(node: IRNode): node is IRTypeAliasDeclaration {
  return node.kind === IRNodeKind.TypeAliasDeclaration;
}

export function isIRDeclaration(node: IRNode): node is IRDeclaration {
  return isIRVariableDeclaration(node) ||
    isIRFunctionDeclaration(node) ||
    isIRClassDeclaration(node) ||
    isIRInterfaceDeclaration(node) ||
    isIREnumDeclaration(node) ||
    isIRTypeAliasDeclaration(node);
}

// ============================================================================
// Decorator Guards
// ============================================================================

export function isIRDecorator(node: IRNode): node is IRDecorator {
  return node.kind === IRNodeKind.Decorator;
}

export function isIRDecoratorFactory(node: IRNode): node is IRDecoratorFactory {
  return node.kind === IRNodeKind.DecoratorFactory;
}

// ============================================================================
// Statement Guards
// ============================================================================

export function isIRBlockStatement(node: IRNode): node is IRBlockStatement {
  return node.kind === IRNodeKind.BlockStatement;
}

export function isIRExpressionStatement(node: IRNode): node is IRExpressionStatement {
  return node.kind === IRNodeKind.ExpressionStatement;
}

export function isIRIfStatement(node: IRNode): node is IRIfStatement {
  return node.kind === IRNodeKind.IfStatement;
}

export function isIRSwitchStatement(node: IRNode): node is IRSwitchStatement {
  return node.kind === IRNodeKind.SwitchStatement;
}

export function isIRWhileStatement(node: IRNode): node is IRWhileStatement {
  return node.kind === IRNodeKind.WhileStatement;
}

export function isIRDoWhileStatement(node: IRNode): node is IRDoWhileStatement {
  return node.kind === IRNodeKind.DoWhileStatement;
}

export function isIRForStatement(node: IRNode): node is IRForStatement {
  return node.kind === IRNodeKind.ForStatement;
}

export function isIRForInStatement(node: IRNode): node is IRForInStatement {
  return node.kind === IRNodeKind.ForInStatement;
}

export function isIRForOfStatement(node: IRNode): node is IRForOfStatement {
  return node.kind === IRNodeKind.ForOfStatement;
}

export function isIRReturnStatement(node: IRNode): node is IRReturnStatement {
  return node.kind === IRNodeKind.ReturnStatement;
}

export function isIRBreakStatement(node: IRNode): node is IRBreakStatement {
  return node.kind === IRNodeKind.BreakStatement;
}

export function isIRContinueStatement(node: IRNode): node is IRContinueStatement {
  return node.kind === IRNodeKind.ContinueStatement;
}

export function isIRThrowStatement(node: IRNode): node is IRThrowStatement {
  return node.kind === IRNodeKind.ThrowStatement;
}

export function isIRTryStatement(node: IRNode): node is IRTryStatement {
  return node.kind === IRNodeKind.TryStatement;
}

export function isIRCatchClause(node: IRNode): node is IRCatchClause {
  return node.kind === IRNodeKind.CatchClause;
}

export function isIRStatement(node: IRNode): node is IRStatement {
  return isIRBlockStatement(node) ||
    isIRExpressionStatement(node) ||
    isIRIfStatement(node) ||
    isIRSwitchStatement(node) ||
    isIRWhileStatement(node) ||
    isIRDoWhileStatement(node) ||
    isIRForStatement(node) ||
    isIRForInStatement(node) ||
    isIRForOfStatement(node) ||
    isIRReturnStatement(node) ||
    isIRBreakStatement(node) ||
    isIRContinueStatement(node) ||
    isIRThrowStatement(node) ||
    isIRTryStatement(node) ||
    isIRDeclaration(node);
}

// ============================================================================
// Expression Guards
// ============================================================================

export function isIRIdentifier(node: IRNode): node is IRIdentifier {
  return node.kind === IRNodeKind.Identifier;
}

export function isIRLiteral(node: IRNode): node is IRLiteral {
  return node.kind === IRNodeKind.Literal;
}

export function isIRArrayExpression(node: IRNode): node is IRArrayExpression {
  return node.kind === IRNodeKind.ArrayExpression;
}

export function isIRObjectExpression(node: IRNode): node is IRObjectExpression {
  return node.kind === IRNodeKind.ObjectExpression;
}

export function isIRFunctionExpression(node: IRNode): node is IRFunctionExpression {
  return node.kind === IRNodeKind.FunctionExpression;
}

export function isIRArrowFunctionExpression(node: IRNode): node is IRArrowFunctionExpression {
  return node.kind === IRNodeKind.ArrowFunctionExpression;
}

export function isIRClassExpression(node: IRNode): node is IRClassExpression {
  return node.kind === IRNodeKind.ClassExpression;
}

export function isIRMemberExpression(node: IRNode): node is IRMemberExpression {
  return node.kind === IRNodeKind.MemberExpression;
}

export function isIROptionalChainingExpression(node: IRNode): node is IROptionalChainingExpression {
  return node.kind === IRNodeKind.OptionalChainingExpression;
}

export function isIRCallExpression(node: IRNode): node is IRCallExpression {
  return node.kind === IRNodeKind.CallExpression;
}

export function isIRNewExpression(node: IRNode): node is IRNewExpression {
  return node.kind === IRNodeKind.NewExpression;
}

export function isIRUpdateExpression(node: IRNode): node is IRUpdateExpression {
  return node.kind === IRNodeKind.UpdateExpression;
}

export function isIRUnaryExpression(node: IRNode): node is IRUnaryExpression {
  return node.kind === IRNodeKind.UnaryExpression;
}

export function isIRBinaryExpression(node: IRNode): node is IRBinaryExpression {
  return node.kind === IRNodeKind.BinaryExpression;
}

export function isIRAssignmentExpression(node: IRNode): node is IRAssignmentExpression {
  return node.kind === IRNodeKind.AssignmentExpression;
}

export function isIRLogicalExpression(node: IRNode): node is IRLogicalExpression {
  return node.kind === IRNodeKind.LogicalExpression;
}

export function isIRConditionalExpression(node: IRNode): node is IRConditionalExpression {
  return node.kind === IRNodeKind.ConditionalExpression;
}

export function isIRThisExpression(node: IRNode): node is IRThisExpression {
  return node.kind === IRNodeKind.ThisExpression;
}

export function isIRSuperExpression(node: IRNode): node is IRSuperExpression {
  return node.kind === IRNodeKind.SuperExpression;
}

export function isIRTemplateLiteral(node: IRNode): node is IRTemplateLiteral {
  return node.kind === IRNodeKind.TemplateLiteral;
}

export function isIRTaggedTemplateExpression(node: IRNode): node is IRTaggedTemplateExpression {
  return node.kind === IRNodeKind.TaggedTemplateExpression;
}

export function isIRYieldExpression(node: IRNode): node is IRYieldExpression {
  return node.kind === IRNodeKind.YieldExpression;
}

export function isIRAwaitExpression(node: IRNode): node is IRAwaitExpression {
  return node.kind === IRNodeKind.AwaitExpression;
}

export function isIRSpreadElement(node: IRNode): node is IRSpreadElement {
  return node.kind === IRNodeKind.SpreadElement;
}

export function isIRExpression(node: IRNode): node is IRExpression {
  return isIRIdentifier(node) ||
    isIRLiteral(node) ||
    isIRArrayExpression(node) ||
    isIRObjectExpression(node) ||
    isIRFunctionExpression(node) ||
    isIRArrowFunctionExpression(node) ||
    isIRClassExpression(node) ||
    isIRMemberExpression(node) ||
    isIROptionalChainingExpression(node) ||
    isIRCallExpression(node) ||
    isIRNewExpression(node) ||
    isIRUpdateExpression(node) ||
    isIRUnaryExpression(node) ||
    isIRBinaryExpression(node) ||
    isIRAssignmentExpression(node) ||
    isIRLogicalExpression(node) ||
    isIRConditionalExpression(node) ||
    isIRThisExpression(node) ||
    isIRSuperExpression(node) ||
    isIRTemplateLiteral(node) ||
    isIRTaggedTemplateExpression(node) ||
    isIRYieldExpression(node) ||
    isIRAwaitExpression(node) ||
    isIRSpreadElement(node);
}

// ============================================================================
// Pattern Guards
// ============================================================================

export function isIRObjectPattern(node: IRNode): node is IRObjectPattern {
  return node.kind === IRNodeKind.ObjectPattern;
}

export function isIRArrayPattern(node: IRNode): node is IRArrayPattern {
  return node.kind === IRNodeKind.ArrayPattern;
}

export function isIRRestElement(node: IRNode): node is IRRestElement {
  return node.kind === IRNodeKind.RestElement;
}

export function isIRAssignmentPattern(node: IRNode): node is IRAssignmentPattern {
  return node.kind === IRNodeKind.AssignmentPattern;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isIRTypeAnnotation(node: IRNode): node is IRTypeAnnotation {
  return node.kind === IRNodeKind.TypeAnnotation;
}

export function isIRTypeParameter(node: IRNode): node is IRTypeParameter {
  return node.kind === IRNodeKind.TypeParameter;
}

export function isIRUnionType(node: IRNode): node is IRUnionType {
  return node.kind === IRNodeKind.UnionType;
}

export function isIRIntersectionType(node: IRNode): node is IRIntersectionType {
  return node.kind === IRNodeKind.IntersectionType;
}

export function isIRTypeGuard(node: IRNode): node is IRTypeGuard {
  return node.kind === IRNodeKind.TypeGuard;
}

// ============================================================================
// C++ Specific Guards
// ============================================================================

export function isIRCppRawExpression(node: IRNode): node is IRCppRawExpression {
  return node.kind === IRNodeKind.CppRawExpression;
}

export function isIRSmartPointerExpression(node: IRNode): node is IRSmartPointerExpression {
  return node.kind === IRNodeKind.SmartPointerExpression;
}

export function isIRMoveExpression(node: IRNode): node is IRMoveExpression {
  return node.kind === IRNodeKind.MoveExpression;
}

// ============================================================================
// Utility Guards
// ============================================================================

/**
 * Check if a node is an async function
 */
export function isAsyncFunction(node: IRNode): boolean {
  if (
    isIRFunctionDeclaration(node) || isIRFunctionExpression(node) ||
    isIRArrowFunctionExpression(node)
  ) {
    return node.isAsync === true;
  }
  return false;
}

/**
 * Check if a node is a generator function
 */
export function isGeneratorFunction(node: IRNode): boolean {
  if (isIRFunctionDeclaration(node) || isIRFunctionExpression(node)) {
    return node.isGenerator === true;
  }
  return false;
}

/**
 * Check if a node has decorators
 */
export function hasDecorators(node: IRNode): boolean {
  if (isIRClassDeclaration(node) || isIRFunctionDeclaration(node)) {
    return node.decorators && node.decorators.length > 0;
  }
  if ("decorators" in node && Array.isArray(node.decorators)) {
    return node.decorators.length > 0;
  }
  return false;
}

/**
 * Check if a node is exported
 */
export function isExported(node: IRNode): boolean {
  if ("isExported" in node) {
    return node.isExported === true;
  }
  return false;
}

/**
 * Check if a node is a loop statement
 */
export function isLoopStatement(node: IRNode): boolean {
  return isIRWhileStatement(node) ||
    isIRDoWhileStatement(node) ||
    isIRForStatement(node) ||
    isIRForInStatement(node) ||
    isIRForOfStatement(node);
}

/**
 * Check if a node is a control flow statement
 */
export function isControlFlowStatement(node: IRNode): boolean {
  return isIRIfStatement(node) ||
    isIRSwitchStatement(node) ||
    isLoopStatement(node) ||
    isIRTryStatement(node);
}

/**
 * Check if a node can have a body
 */
export function hasBody(node: IRNode): boolean {
  return isIRFunctionDeclaration(node) ||
    isIRFunctionExpression(node) ||
    isIRArrowFunctionExpression(node) ||
    isIRClassDeclaration(node) ||
    isIRClassExpression(node) ||
    isIRBlockStatement(node) ||
    isControlFlowStatement(node);
}
