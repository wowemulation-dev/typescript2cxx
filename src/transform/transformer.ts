/**
 * AST to IR transformer
 */

import { ts } from "../ast/parser.ts";
import { MemoryAnnotation, MemoryAnnotationParser } from "../memory/annotations.ts";
import type { SimpleTypeChecker } from "../type-checker/simple-checker.ts";
import type {
  IRArrayExpression,
  IRAssignmentExpression,
  IRBinaryExpression,
  IRBlockStatement,
  IRCallExpression,
  IRCatchClause,
  IRClassDeclaration,
  IRClassMember,
  IRConditionalExpression,
  IRDeclaration as _IRDeclaration,
  IRExpression,
  IRExpressionStatement,
  IRForStatement,
  IRFunctionDeclaration,
  IRIdentifier,
  IRIfStatement,
  IRInterfaceDeclaration,
  IRLiteral,
  IRMemberExpression,
  IRMethodDefinition,
  IRModule,
  IRNewExpression,
  IRNode,
  IRObjectExpression,
  IRObjectProperty,
  IROptionalChainingExpression,
  IRParameter,
  IRProgram,
  IRPropertyDefinition,
  IRReturnStatement,
  IRStatement,
  IRTemplateLiteral,
  IRThisExpression,
  IRThrowStatement,
  IRTryStatement,
  IRUnaryExpression,
  IRVariableDeclaration,
  IRVariableDeclarator,
  IRWhileStatement,
} from "../ir/nodes.ts";
import { AccessModifier, IRNodeKind, MemoryManagement, VariableKind } from "../ir/nodes.ts";
import { UnsupportedFeatureError as _UnsupportedFeatureError } from "../errors.ts";
import type { SourceLocation as _SourceLocation, TranspilerWarning } from "../types.ts";

/**
 * Transform options
 */
export interface TransformOptions {
  /** Current file being transformed */
  filename?: string;

  /** Source code being transformed */
  source?: string;

  /** Compiler context */
  context: any;

  /** Active plugins */
  plugins: any[];

  /** Error reporter */
  errorReporter: any;

  /** Type checker instance */
  typeChecker?: SimpleTypeChecker;

  /** Output filename */
  outputName?: string;
}

/**
 * Transform context for tracking state during transformation
 */
interface TransformContext {
  /** Current module being built */
  currentModule: IRModule;

  /** Current class (if inside a class) */
  currentClass?: IRClassDeclaration;

  /** Current function (if inside a function) */
  currentFunction?: IRFunctionDeclaration;

  /** Scope stack for variable resolution */
  scopeStack: Map<string, IRNode>[];

  /** Warnings collected during transformation */
  warnings: TranspilerWarning[];

  /** Required headers */
  headers: Set<string>;

  /** Required includes */
  includes: Set<string>;

  /** Memory annotation parser */
  memoryAnnotations: MemoryAnnotationParser;

  /** Type checker instance */
  typeChecker?: SimpleTypeChecker;
}

/**
 * Transform TypeScript AST to IR
 */
export function transformToIR(
  ast: ts.SourceFile,
  options: TransformOptions,
): IRProgram {
  const transformer = new ASTTransformer(options);
  return transformer.transform(ast);
}

/**
 * Binary operator type (matching IR)
 */
type BinaryOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "=="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "&&"
  | "||"
  | "&"
  | "|"
  | "^"
  | "<<"
  | ">>"
  | ">>>"
  | "??";

/**
 * Unary operator type (matching IR)
 */
type UnaryOp = "+" | "-" | "!" | "~" | "++" | "--" | "typeof" | "void" | "delete";

/**
 * AST to IR transformer implementation
 */
class ASTTransformer {
  private options: TransformOptions;
  private context: TransformContext;

  constructor(options: TransformOptions) {
    this.options = options;
    // Use outputName from options if available, otherwise default to "main"
    const moduleName = (options as any).outputName || "main";
    const runtimeInclude = options.context.options.runtimeInclude || "runtime/core.h";

    // Initialize memory annotation parser
    const memoryAnnotations = new MemoryAnnotationParser();
    if (options.source) {
      memoryAnnotations.parse(options.source, options.filename || "<anonymous>");
    }

    this.context = {
      currentModule: this.createModule(moduleName),
      scopeStack: [new Map()],
      warnings: [],
      headers: new Set(["<iostream>", "<string>", "<memory>"]),
      includes: new Set([runtimeInclude]),
      memoryAnnotations,
      typeChecker: options.typeChecker,
    };
  }

  /**
   * Transform the AST to IR
   */
  transform(ast: ts.SourceFile): IRProgram {
    // Transform the module body
    for (const statement of ast.statements) {
      const stmt = this.transformModuleItem(statement);
      if (stmt) {
        this.context.currentModule.body.push(stmt);
      }
    }

    // Apply headers
    this.context.currentModule.headers = Array.from(this.context.headers);

    // Create the program
    const program: IRProgram = {
      kind: IRNodeKind.Program,
      modules: [this.context.currentModule],
      includes: Array.from(this.context.includes),
      entryModule: "main",
    };

    return program;
  }

  /**
   * Transform a module-level item
   */
  private transformModuleItem(node: ts.Statement): IRStatement | null {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        return this.transformImport(node as ts.ImportDeclaration);

      case ts.SyntaxKind.ExportDeclaration:
        return this.transformExport(node as ts.ExportDeclaration);

      case ts.SyntaxKind.FunctionDeclaration:
        return this.transformFunctionDeclaration(node as ts.FunctionDeclaration);

      case ts.SyntaxKind.ClassDeclaration:
        return this.transformClassDeclaration(node as ts.ClassDeclaration);

      case ts.SyntaxKind.VariableStatement:
        return this.transformVariableStatement(node as ts.VariableStatement);

      case ts.SyntaxKind.InterfaceDeclaration:
        return this.transformInterfaceDeclaration(node as ts.InterfaceDeclaration);

      case ts.SyntaxKind.TypeAliasDeclaration:
        return this.transformTypeAlias(node as ts.TypeAliasDeclaration);

      case ts.SyntaxKind.EnumDeclaration:
        return this.transformEnumDeclaration(node as ts.EnumDeclaration);

      case ts.SyntaxKind.ExpressionStatement:
        return this.transformExpressionStatement(node as ts.ExpressionStatement);

      case ts.SyntaxKind.IfStatement:
        return this.transformIfStatement(node as ts.IfStatement);

      case ts.SyntaxKind.WhileStatement:
        return this.transformWhileStatement(node as ts.WhileStatement);

      case ts.SyntaxKind.ForStatement:
        return this.transformForStatement(node as ts.ForStatement);

      case ts.SyntaxKind.ReturnStatement:
        return this.transformReturnStatement(node as ts.ReturnStatement);

      case ts.SyntaxKind.TryStatement:
        return this.transformTryStatement(node as ts.TryStatement);

      case ts.SyntaxKind.ThrowStatement:
        return this.transformThrowStatement(node as ts.ThrowStatement);

      case ts.SyntaxKind.Block:
        return this.transformBlockStatement(node as ts.Block);

      default:
        this.warn(`Unsupported module item type: ${ts.SyntaxKind[node.kind]}`);
        return null;
    }
  }

  /**
   * Transform import declaration
   */
  private transformImport(node: any): null {
    // Track imports but don't generate IR nodes for them
    if (node.source?.value) {
      this.context.currentModule.imports.push(node.source.value);
    }
    return null;
  }

  /**
   * Transform export declaration
   */
  private transformExport(node: any): IRStatement | null {
    if (node.declaration) {
      const stmt = this.transformModuleItem(node.declaration);

      // Track exported names
      if (node.declaration.id?.value) {
        this.context.currentModule.exports.push(node.declaration.id.value);
      }

      return stmt;
    }

    return null;
  }

  /**
   * Transform function declaration
   */
  private transformFunctionDeclaration(node: any): IRFunctionDeclaration {
    const name = node.identifier?.value || "anonymous";
    const params = this.transformParameters(node.params || []);
    const returnType = this.resolveType(node.returnType);

    const func: IRFunctionDeclaration = {
      kind: IRNodeKind.FunctionDeclaration,
      id: { kind: IRNodeKind.Identifier, name },
      params,
      returnType,
      body: null as any,
      isAsync: node.async || false,
      isGenerator: node.generator || false,
    };

    // Transform body with function context
    const prevFunc = this.context.currentFunction;
    this.context.currentFunction = func;
    this.pushScope();

    // Add parameters to scope
    for (const param of params) {
      // Create a simple identifier node for scope tracking
      const paramIdent: IRIdentifier = {
        kind: IRNodeKind.Identifier,
        name: param.name,
      };
      this.addToScope(param.name, paramIdent);
    }

    if (node.body) {
      func.body = this.transformBlockStatement(node.body);
    }

    this.popScope();
    this.context.currentFunction = prevFunc;

    return func;
  }

  /**
   * Transform class declaration
   */
  private transformClassDeclaration(node: ts.ClassDeclaration): IRClassDeclaration {
    const name = node.name?.text || "anonymous";

    // Get superclass from heritage clauses
    let superClassExpr: IRExpression | undefined;
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword && clause.types.length > 0) {
          const type = clause.types[0];
          superClassExpr = this.transformExpression(type.expression);
          break;
        }
      }
    }

    const cls: IRClassDeclaration = {
      kind: IRNodeKind.ClassDeclaration,
      id: { kind: IRNodeKind.Identifier, name },
      superClass: superClassExpr,
      implements: [],
      members: [],
      isAbstract: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword),
    };

    // Transform class body
    const prevClass = this.context.currentClass;
    this.context.currentClass = cls;
    this.pushScope();

    // Transform class members
    for (const member of node.members) {
      const irMember = this.transformClassMember(member);
      if (irMember) {
        cls.members.push(irMember);
      }
    }

    this.popScope();
    this.context.currentClass = prevClass;

    return cls;
  }

  /**
   * Transform class member
   */
  private transformClassMember(node: ts.ClassElement): IRClassMember | null {
    switch (node.kind) {
      case ts.SyntaxKind.PropertyDeclaration:
        return this.transformPropertyDefinition(node as ts.PropertyDeclaration);

      case ts.SyntaxKind.MethodDeclaration:
        return this.transformMethodDefinition(node as ts.MethodDeclaration);

      case ts.SyntaxKind.Constructor:
        return this.transformConstructor(node as ts.ConstructorDeclaration);

      default:
        this.warn(`Unsupported class member type: ${ts.SyntaxKind[node.kind]}`);
        return null;
    }
  }

  /**
   * Transform property definition
   */
  private transformPropertyDefinition(node: ts.PropertyDeclaration): IRPropertyDefinition {
    const key = node.name
      ? this.getPropertyNameAsExpression(node.name)
      : { kind: IRNodeKind.Identifier, name: "unknown" } as IRIdentifier;
    const propertyName = node.name ? this.getPropertyName(node.name) : "unknown";

    // Get memory annotation from JSDoc comments
    const filename = this.options.filename || "<anonymous>";
    const lineNumber = this.getLineNumber(node);
    const memoryAnnotation = this.context.memoryAnnotations.getAnnotation(
      filename,
      lineNumber,
      propertyName,
    );

    const memory = this.convertMemoryAnnotation(memoryAnnotation);

    return {
      kind: IRNodeKind.VariableDeclaration,
      key: key as (IRIdentifier | IRLiteral),
      value: node.initializer ? this.transformExpression(node.initializer) : undefined,
      type: node.type ? this.resolveType(node.type) : "auto",
      accessibility: this.getAccessModifierFromNode(node),
      isStatic: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
      isReadonly: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword),
      memory,
    };
  }

  /**
   * Transform method definition
   */
  private transformMethodDefinition(node: ts.MethodDeclaration): IRMethodDefinition {
    const key = node.name
      ? this.getPropertyNameAsExpression(node.name)
      : { kind: IRNodeKind.Identifier, name: "unknown" } as IRIdentifier;

    // In TypeScript AST, the method node itself contains all the information
    const params = this.transformParameters(Array.from(node.parameters));
    const returnType = node.type ? this.resolveType(node.type) : "auto";

    // Create the function declaration for the method
    const funcDecl: IRFunctionDeclaration = {
      kind: IRNodeKind.FunctionDeclaration,
      id: null,
      params,
      returnType,
      body: null as any,
      isAsync: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
      isGenerator: !!node.asteriskToken,
      isStatic: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
    };

    // Transform body
    if (node.body) {
      const prevFunc = this.context.currentFunction;
      this.context.currentFunction = funcDecl;
      this.pushScope();

      // Add parameters to scope
      for (const param of params) {
        const paramIdent: IRIdentifier = {
          kind: IRNodeKind.Identifier,
          name: param.name,
        };
        this.addToScope(param.name, paramIdent);
      }

      funcDecl.body = this.transformBlockStatement(node.body);

      this.popScope();
      this.context.currentFunction = prevFunc;
    }

    const method: IRMethodDefinition = {
      kind: IRNodeKind.FunctionDeclaration,
      key: key as (IRIdentifier | IRLiteral),
      value: funcDecl,
      accessibility: this.getAccessModifierFromNode(node),
      isStatic: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
    };

    return method;
  }

  /**
   * Transform constructor
   */
  private transformConstructor(node: any): IRMethodDefinition {
    const params = this.transformParameters(node.params || []);

    const funcDecl: IRFunctionDeclaration = {
      kind: IRNodeKind.FunctionDeclaration,
      id: null,
      params,
      returnType: "void",
      body: null as any,
      isAsync: false,
      isGenerator: false,
    };

    // Transform body
    if (node.body) {
      this.pushScope();

      // Add parameters to scope
      for (const param of params) {
        const paramIdent: IRIdentifier = {
          kind: IRNodeKind.Identifier,
          name: param.name,
        };
        this.addToScope(param.name, paramIdent);
      }

      funcDecl.body = this.transformBlockStatement(node.body);

      this.popScope();
    }

    return {
      kind: IRNodeKind.FunctionDeclaration,
      key: { kind: IRNodeKind.Identifier, name: "constructor" },
      value: funcDecl,
      accessibility: "public",
      isStatic: false,
    };
  }

  /**
   * Transform variable statement
   */
  private transformVariableStatement(node: ts.VariableStatement): IRVariableDeclaration {
    const declarations: IRVariableDeclarator[] = [];

    for (const decl of node.declarationList.declarations) {
      const id: IRIdentifier = {
        kind: IRNodeKind.Identifier,
        name: ts.isIdentifier(decl.name) ? decl.name.text : "unknown",
      };

      const declarator: IRVariableDeclarator = {
        id,
        cppType: decl.type ? this.resolveTypeForDeclaration(decl) : "auto",
        init: decl.initializer ? this.transformExpression(decl.initializer) : undefined,
        memory: MemoryManagement.Auto,
      };

      declarations.push(declarator);
      this.addToScope(id.name, id);
    }

    const flags = node.declarationList.flags;
    const declarationKind = (flags & ts.NodeFlags.Const)
      ? "const"
      : (flags & ts.NodeFlags.Let)
      ? "let"
      : "var";

    return {
      kind: IRNodeKind.VariableDeclaration,
      declarationKind: declarationKind as VariableKind,
      declarations,
    };
  }

  /**
   * Transform interface declaration
   */
  private transformInterfaceDeclaration(node: ts.InterfaceDeclaration): IRInterfaceDeclaration {
    return {
      kind: IRNodeKind.InterfaceDeclaration,
      id: { kind: IRNodeKind.Identifier, name: node.name.text },
      extends: [],
      body: {
        body: [],
      },
    };
  }

  /**
   * Transform type alias
   */
  private transformTypeAlias(_node: ts.TypeAliasDeclaration): IRExpressionStatement {
    // Type aliases don't generate runtime code
    // Return a placeholder expression statement
    return {
      kind: IRNodeKind.ExpressionStatement,
      expression: this.createLiteral(null),
    };
  }

  /**
   * Transform enum declaration
   */
  private transformEnumDeclaration(_node: any): IRExpressionStatement {
    // TODO: Implement enum transformation
    // Return a placeholder statement
    return {
      kind: IRNodeKind.ExpressionStatement,
      expression: this.createLiteral(null),
    };
  }

  /**
   * Transform expression statement
   */
  private transformExpressionStatement(node: any): IRExpressionStatement {
    return {
      kind: IRNodeKind.ExpressionStatement,
      expression: this.transformExpression(node.expression),
    };
  }

  /**
   * Transform if statement
   */
  private transformIfStatement(node: any): IRIfStatement {
    return {
      kind: IRNodeKind.IfStatement,
      test: this.transformExpression(node.test),
      consequent: this.transformStatement(node.consequent),
      alternate: node.alternate ? this.transformStatement(node.alternate) : undefined,
    };
  }

  /**
   * Transform while statement
   */
  private transformWhileStatement(node: any): IRWhileStatement {
    return {
      kind: IRNodeKind.WhileStatement,
      test: this.transformExpression(node.test),
      body: this.transformStatement(node.body),
    };
  }

  /**
   * Transform for statement
   */
  private transformForStatement(node: any): IRForStatement {
    this.pushScope();

    const forStmt: IRForStatement = {
      kind: IRNodeKind.ForStatement,
      init: node.init ? this.transformForInit(node.init) : undefined,
      test: node.test ? this.transformExpression(node.test) : undefined,
      update: node.update ? this.transformExpression(node.update) : undefined,
      body: this.transformStatement(node.body),
    };

    this.popScope();

    return forStmt;
  }

  /**
   * Transform for loop initializer
   */
  private transformForInit(node: ts.ForInitializer): IRVariableDeclaration | IRExpression {
    if (ts.isVariableDeclarationList(node)) {
      // Create a synthetic variable statement
      const varStmt = ts.factory.createVariableStatement(
        undefined,
        node,
      );
      return this.transformVariableStatement(varStmt);
    }
    return this.transformExpression(node as ts.Expression);
  }

  /**
   * Transform return statement
   */
  private transformReturnStatement(node: ts.ReturnStatement): IRReturnStatement {
    return {
      kind: IRNodeKind.ReturnStatement,
      argument: node.expression ? this.transformExpression(node.expression) : undefined,
    };
  }

  /**
   * Transform try statement
   */
  private transformTryStatement(node: ts.TryStatement): IRTryStatement {
    return {
      kind: IRNodeKind.TryStatement,
      block: this.transformBlockStatement(node.tryBlock),
      handler: node.catchClause ? this.transformCatchClause(node.catchClause) : undefined,
      finalizer: node.finallyBlock ? this.transformBlockStatement(node.finallyBlock) : undefined,
    };
  }

  /**
   * Transform catch clause
   */
  private transformCatchClause(node: ts.CatchClause): IRCatchClause {
    return {
      kind: IRNodeKind.CatchClause,
      param: node.variableDeclaration?.name && ts.isIdentifier(node.variableDeclaration.name)
        ? this.transformIdentifier(node.variableDeclaration.name)
        : undefined,
      exceptionType: node.variableDeclaration?.type
        ? this.resolveType(node.variableDeclaration.type)
        : "js::Error",
      body: this.transformBlockStatement(node.block),
    };
  }

  /**
   * Transform throw statement
   */
  private transformThrowStatement(node: ts.ThrowStatement): IRThrowStatement {
    return {
      kind: IRNodeKind.ThrowStatement,
      argument: this.transformExpression(node.expression),
    };
  }

  /**
   * Transform block statement
   */
  private transformBlockStatement(node: ts.Block): IRBlockStatement {
    this.pushScope();

    const statements: IRStatement[] = [];

    for (const stmt of node.statements) {
      const irStmt = this.transformStatement(stmt);
      if (irStmt) {
        statements.push(irStmt);
      }
    }

    this.popScope();

    return {
      kind: IRNodeKind.BlockStatement,
      body: statements,
    };
  }

  /**
   * Transform any statement
   */
  private transformStatement(node: ts.Statement): IRStatement {
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        return this.transformBlockStatement(node as ts.Block);
      case ts.SyntaxKind.ExpressionStatement:
        return this.transformExpressionStatement(node as ts.ExpressionStatement);
      case ts.SyntaxKind.IfStatement:
        return this.transformIfStatement(node as ts.IfStatement);
      case ts.SyntaxKind.WhileStatement:
        return this.transformWhileStatement(node as ts.WhileStatement);
      case ts.SyntaxKind.ForStatement:
        return this.transformForStatement(node as ts.ForStatement);
      case ts.SyntaxKind.ReturnStatement:
        return this.transformReturnStatement(node as ts.ReturnStatement);
      case ts.SyntaxKind.VariableStatement:
        return this.transformVariableStatement(node as ts.VariableStatement);
      case ts.SyntaxKind.TryStatement:
        return this.transformTryStatement(node as ts.TryStatement);
      case ts.SyntaxKind.ThrowStatement:
        return this.transformThrowStatement(node as ts.ThrowStatement);
      default: {
        this.warn(`Unsupported statement type: ${ts.SyntaxKind[node.kind]}`);
        const placeholder: IRExpressionStatement = {
          kind: IRNodeKind.ExpressionStatement,
          expression: this.createLiteral(null),
        };
        return placeholder;
      }
    }
  }

  /**
   * Transform expression
   */
  private transformExpression(node: ts.Expression): IRExpression {
    if (!node) {
      return this.createLiteral(null);
    }

    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        return this.transformIdentifier(node as ts.Identifier);

      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
      case ts.SyntaxKind.NullKeyword:
        return this.transformLiteral(node);

      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.transformArrayExpression(node as ts.ArrayLiteralExpression);

      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.transformObjectExpression(node as ts.ObjectLiteralExpression);

      case ts.SyntaxKind.CallExpression:
        return this.transformCallExpression(node as ts.CallExpression);

      case ts.SyntaxKind.PropertyAccessExpression:
      case ts.SyntaxKind.ElementAccessExpression:
        return this.transformMemberExpression(
          node as ts.PropertyAccessExpression | ts.ElementAccessExpression,
        );

      case ts.SyntaxKind.NonNullExpression:
        return this.transformOptionalChainingExpression(node);

      case ts.SyntaxKind.BinaryExpression:
        return this.transformBinaryExpression(node as ts.BinaryExpression);

      case ts.SyntaxKind.PrefixUnaryExpression:
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.transformUnaryExpression(
          node as ts.PrefixUnaryExpression | ts.PostfixUnaryExpression,
        );

      case ts.SyntaxKind.ConditionalExpression:
        return this.transformConditionalExpression(node as ts.ConditionalExpression);

      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return this.transformTemplateLiteral(node);

      case ts.SyntaxKind.ArrowFunction:
        return this.transformArrowFunction(node as ts.ArrowFunction);

      case ts.SyntaxKind.ThisKeyword:
        return this.transformThisExpression(node);

      case ts.SyntaxKind.SuperKeyword:
        return this.transformSuperExpression(node);

      case ts.SyntaxKind.NewExpression:
        return this.transformNewExpression(node as ts.NewExpression);

      default:
        this.warn(`Unsupported expression type: ${ts.SyntaxKind[node.kind]}`);
        return this.createLiteral(null);
    }
  }

  /**
   * Transform identifier
   */
  private transformIdentifier(node: ts.Identifier): IRIdentifier {
    return {
      kind: IRNodeKind.Identifier,
      name: node.text,
    };
  }

  /**
   * Transform literal
   */
  private transformLiteral(node: ts.Expression): IRLiteral {
    let value: any;
    let type: string;

    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
        value = (node as ts.StringLiteral).text;
        type = "string";
        break;
      case ts.SyntaxKind.NumericLiteral:
        value = Number((node as ts.NumericLiteral).text);
        type = "number";
        break;
      case ts.SyntaxKind.TrueKeyword:
        value = true;
        type = "boolean";
        break;
      case ts.SyntaxKind.FalseKeyword:
        value = false;
        type = "boolean";
        break;
      case ts.SyntaxKind.NullKeyword:
        value = null;
        type = "null";
        break;
      default:
        value = null;
        type = "unknown";
    }

    // Map type to literalType enum
    let literalType: "string" | "number" | "boolean" | "null" | "bigint" | "regexp";
    switch (type) {
      case "string":
        literalType = "string";
        break;
      case "number":
        literalType = "number";
        break;
      case "boolean":
        literalType = "boolean";
        break;
      case "null":
        literalType = "null";
        break;
      case "bigint":
        literalType = "bigint";
        break;
      default:
        literalType = "null"; // Default to null for unknown types
    }

    return {
      kind: IRNodeKind.Literal,
      value,
      cppType: type,
      raw: String(value),
      literalType,
    };
  }

  /**
   * Transform array expression
   */
  private transformArrayExpression(node: ts.ArrayLiteralExpression): IRArrayExpression {
    const elements: IRExpression[] = [];

    for (const elem of node.elements) {
      if (ts.isSpreadElement(elem)) {
        // Handle spread elements later
        this.warn("Spread elements in arrays not yet supported");
      } else {
        elements.push(this.transformExpression(elem));
      }
    }

    return {
      kind: IRNodeKind.ArrayExpression,
      elements,
    };
  }

  /**
   * Transform object expression
   */
  private transformObjectExpression(node: ts.ObjectLiteralExpression): IRObjectExpression {
    const properties: IRObjectProperty[] = [];

    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        properties.push({
          key: this.getPropertyKeyAsExpression(prop.name),
          value: this.transformExpression(prop.initializer),
          kind: "init",
          computed: ts.isComputedPropertyName(prop.name),
          method: false,
          shorthand: false,
        });
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        properties.push({
          key: this.getPropertyKeyAsExpression(prop.name),
          value: this.transformExpression(prop.name),
          kind: "init",
          computed: false,
          method: false,
          shorthand: true,
        });
      }
    }

    return {
      kind: IRNodeKind.ObjectExpression,
      properties,
    };
  }

  /**
   * Transform call expression
   */
  private transformCallExpression(node: ts.CallExpression): IRCallExpression {
    const args: IRExpression[] = [];

    for (const arg of node.arguments) {
      if (ts.isSpreadElement(arg)) {
        // Handle spread arguments later
        this.warn("Spread arguments not yet supported");
      } else {
        args.push(this.transformExpression(arg));
      }
    }

    return {
      kind: IRNodeKind.CallExpression,
      callee: this.transformExpression(node.expression),
      arguments: args,
      optional: !!node.questionDotToken,
    };
  }

  /**
   * Transform member expression
   */
  private transformMemberExpression(
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  ): IRMemberExpression {
    // Check if this is computed access (array[index])
    const isComputed = node.kind === ts.SyntaxKind.ElementAccessExpression;

    let property: IRExpression;
    if (isComputed) {
      // For element access, use the argument expression
      const elementAccess = node as ts.ElementAccessExpression;
      property = this.transformExpression(elementAccess.argumentExpression);
    } else {
      // For property access, transform the property name
      const propertyAccess = node as ts.PropertyAccessExpression;
      if (ts.isPrivateIdentifier(propertyAccess.name)) {
        // Handle private identifiers
        property = {
          kind: IRNodeKind.Identifier,
          name: propertyAccess.name.text,
        } as IRIdentifier;
      } else {
        property = this.transformIdentifier(propertyAccess.name);
      }
    }

    return {
      kind: IRNodeKind.MemberExpression,
      object: this.transformExpression(node.expression),
      property,
      computed: isComputed,
      optional: false, // TODO: Detect optional chaining
    };
  }

  /**
   * Transform optional chaining expression
   */
  private transformOptionalChainingExpression(node: any): IROptionalChainingExpression {
    return {
      kind: IRNodeKind.OptionalChainingExpression,
      base: this.transformExpression(node.base),
    };
  }

  /**
   * Transform binary expression
   */
  private transformBinaryExpression(node: any): IRBinaryExpression | IRAssignmentExpression {
    const opText = ts.tokenToString(node.operatorToken.kind);

    // Check if this is an assignment expression
    if (opText === "=" || opText?.endsWith("=")) {
      return {
        kind: IRNodeKind.AssignmentExpression,
        operator: opText,
        left: this.transformExpression(node.left),
        right: this.transformExpression(node.right),
      };
    }

    const op = this.mapBinaryOperator(opText || String(node.operator));

    return {
      kind: IRNodeKind.BinaryExpression,
      operator: op,
      left: this.transformExpression(node.left),
      right: this.transformExpression(node.right),
    };
  }

  /**
   * Transform unary expression
   */
  private transformUnaryExpression(node: any): IRUnaryExpression {
    const op = this.mapUnaryOperator(node.operator);

    return {
      kind: IRNodeKind.UnaryExpression,
      operator: op,
      operand: this.transformExpression(node.argument),
      prefix: node.prefix !== false,
    };
  }

  /**
   * Transform assignment expression
   */
  private transformAssignmentExpression(node: any): IRAssignmentExpression {
    return {
      kind: IRNodeKind.AssignmentExpression,
      operator: node.operator,
      left: this.transformExpression(node.left),
      right: this.transformExpression(node.right),
    };
  }

  /**
   * Transform conditional expression
   */
  private transformConditionalExpression(node: any): IRConditionalExpression {
    return {
      kind: IRNodeKind.ConditionalExpression,
      test: this.transformExpression(node.test),
      consequent: this.transformExpression(node.consequent),
      alternate: this.transformExpression(node.alternate),
    };
  }

  /**
   * Transform template literal
   */
  private transformTemplateLiteral(node: any): IRExpression {
    // TypeScript template expressions
    if (node.kind === ts.SyntaxKind.TemplateExpression) {
      const parts: Array<IRExpression | IRLiteral> = [];

      // Add the head literal
      if (node.head && node.head.text) {
        parts.push(this.createLiteral(node.head.text));
      }

      // Add template spans (expression + literal)
      if (node.templateSpans) {
        for (const span of node.templateSpans) {
          // Add the expression
          parts.push(this.transformExpression(span.expression));

          // Add the literal part after the expression
          if (span.literal && span.literal.text) {
            parts.push(this.createLiteral(span.literal.text));
          }
        }
      }

      return {
        kind: IRNodeKind.TemplateLiteral,
        parts,
      } as IRTemplateLiteral;
    }

    // No substitution template literal (simple template string)
    if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
      return this.createLiteral(node.text || "");
    }

    // Fallback for other cases
    return this.createLiteral("");
  }

  /**
   * Transform arrow function
   */
  private transformArrowFunction(_node: any): IRExpression {
    // TODO: Implement arrow function transformation
    return this.createLiteral("() => {}");
  }

  /**
   * Transform this expression
   */
  private transformThisExpression(_node: any): IRThisExpression {
    return {
      kind: IRNodeKind.ThisExpression,
    };
  }

  /**
   * Transform super expression
   */
  private transformSuperExpression(_node: any): IRIdentifier {
    // We represent super as a special identifier
    // The code generator will handle it appropriately
    return { kind: IRNodeKind.Identifier, name: "super" };
  }

  /**
   * Transform new expression
   */
  private transformNewExpression(node: ts.NewExpression): IRNewExpression {
    const args: IRExpression[] = [];

    if (node.arguments) {
      for (const arg of node.arguments) {
        args.push(this.transformExpression(arg));
      }
    }

    return {
      kind: IRNodeKind.NewExpression,
      callee: this.transformExpression(node.expression),
      arguments: args,
    };
  }

  /**
   * Transform update expression (++ and --)
   */
  private transformUpdateExpression(node: any): IRUnaryExpression {
    const operator = node.operator as UnaryOp;
    return {
      kind: IRNodeKind.UnaryExpression,
      operator,
      operand: this.transformExpression(node.argument),
      prefix: node.prefix,
    };
  }

  /**
   * Transform parameters
   */
  private transformParameters(params: any[]): IRParameter[] {
    const result: IRParameter[] = [];

    for (const param of params) {
      if (param.type === "Identifier") {
        result.push({
          name: param.value,
          type: this.resolveType(param.typeAnnotation),
          isOptional: param.optional || false,
          isRest: false,
          memory: MemoryManagement.Auto,
        });
      } else if (param.pat?.type === "Identifier") {
        result.push({
          name: param.pat.value,
          type: this.resolveType(param.pat.typeAnnotation),
          isOptional: param.pat.optional || false,
          isRest: false,
          memory: MemoryManagement.Auto,
        });
      }
    }

    return result;
  }

  /**
   * Helper methods
   */

  private createModule(name: string): IRModule {
    return {
      kind: IRNodeKind.Module,
      name,
      body: [],
      exports: [],
      imports: [],
      headers: [],
    };
  }

  private createLiteral(value: any): IRLiteral {
    let literalType: "string" | "number" | "boolean" | "null" | "bigint" | "regexp";

    if (value === null) {
      literalType = "null";
    } else if (typeof value === "string") {
      literalType = "string";
    } else if (typeof value === "number") {
      literalType = "number";
    } else if (typeof value === "boolean") {
      literalType = "boolean";
    } else if (typeof value === "bigint") {
      literalType = "bigint";
    } else {
      literalType = "null";
    }

    return {
      kind: IRNodeKind.Literal,
      value,
      cppType: typeof value === "object" ? "null" : typeof value,
      raw: String(value),
      literalType,
    };
  }

  private getPropertyName(key: ts.PropertyName): string {
    if (ts.isIdentifier(key)) {
      return key.text;
    }
    if (ts.isStringLiteral(key)) {
      return key.text;
    }
    return "unknown";
  }

  private getPropertyNameAsExpression(key: ts.PropertyName): IRIdentifier | IRLiteral {
    if (ts.isIdentifier(key)) {
      return { kind: IRNodeKind.Identifier, name: key.text };
    }
    if (ts.isStringLiteral(key)) {
      return {
        kind: IRNodeKind.Literal,
        value: key.text,
        cppType: "string",
        raw: `"${key.text}"`,
        literalType: "string",
      };
    }
    return { kind: IRNodeKind.Identifier, name: "unknown" };
  }

  private getPropertyKeyAsExpression(key: any): IRIdentifier | IRLiteral | IRExpression {
    if (key.type === "Identifier") {
      return { kind: IRNodeKind.Identifier, name: key.value };
    }
    if (key.type === "StringLiteral") {
      return {
        kind: IRNodeKind.Literal,
        value: key.value,
        cppType: "string",
        raw: `"${key.value}"`,
        literalType: "string",
      };
    }
    return this.transformExpression(key);
  }

  private getAccessibility(node: any): "public" | "private" | "protected" | undefined {
    return node.accessibility;
  }

  private getAccessModifier(node: any): AccessModifier {
    if (node.accessibility === "private") return AccessModifier.Private;
    if (node.accessibility === "protected") return AccessModifier.Protected;
    return AccessModifier.Public;
  }

  private getAccessModifierFromNode(
    node: ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> },
  ): AccessModifier {
    if (node.modifiers) {
      if (node.modifiers.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {
        return AccessModifier.Private;
      }
      if (node.modifiers.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)) {
        return AccessModifier.Protected;
      }
    }
    return AccessModifier.Public;
  }

  private getVariableKind(kind: string): VariableKind {
    switch (kind) {
      case "const":
        return VariableKind.Const;
      case "let":
        return VariableKind.Let;
      case "var":
        return VariableKind.Var;
      default:
        return VariableKind.Let;
    }
  }

  private mapBinaryOperator(op: string): BinaryOp {
    const mapping: Record<string, BinaryOp> = {
      "+": "+",
      "-": "-",
      "*": "*",
      "/": "/",
      "%": "%",
      "==": "==",
      "===": "==",
      "!=": "!=",
      "!==": "!=",
      "<": "<",
      ">": ">",
      "<=": "<=",
      ">=": ">=",
      "&&": "&&",
      "||": "||",
      "&": "&",
      "|": "|",
      "^": "^",
      "<<": "<<",
      ">>": ">>",
      ">>>": ">>>",
      "??": "??",
    };

    return mapping[op] || "+";
  }

  private mapUnaryOperator(op: string): UnaryOp {
    const mapping: Record<string, UnaryOp> = {
      "+": "+",
      "-": "-",
      "!": "!",
      "~": "~",
      "++": "++",
      "--": "--",
      "typeof": "typeof",
      "void": "void",
      "delete": "delete",
    };

    return mapping[op] || "+";
  }

  private resolveType(typeNode: ts.TypeNode | undefined): string {
    if (!typeNode) return "auto";

    // If we have a type checker, use it for accurate type resolution
    if (this.context.typeChecker) {
      const resolvedType = this.context.typeChecker.getTypeAtLocation(typeNode);
      return resolvedType.cppType;
    }

    // Fallback to basic type mapping
    return this.resolveTypeNode(typeNode);
  }

  private resolveTypeForDeclaration(decl: ts.VariableDeclaration): string {
    if (!decl.type) return "auto";

    // If we have a type checker, use the declaration node as key (not the type node)
    if (this.context.typeChecker) {
      const resolvedType = this.context.typeChecker.getTypeAtLocation(decl);
      return resolvedType.cppType;
    }

    // Fallback to basic type mapping using the type annotation
    return this.resolveTypeNode(decl.type);
  }

  private resolveTypeNode(node: ts.TypeNode): string {
    if (!node) return "unknown";

    switch (node.kind) {
      case ts.SyntaxKind.StringKeyword:
        return "js::string";
      case ts.SyntaxKind.NumberKeyword:
        return "js::number";
      case ts.SyntaxKind.BooleanKeyword:
        return "bool";
      case ts.SyntaxKind.VoidKeyword:
        return "void";
      case ts.SyntaxKind.AnyKeyword:
        return "js::any";
      case ts.SyntaxKind.UnknownKeyword:
        return "js::unknown";
      case ts.SyntaxKind.NeverKeyword:
        return "void";
      case ts.SyntaxKind.NullKeyword:
        return "std::nullptr_t";
      case ts.SyntaxKind.UndefinedKeyword:
        return "js::undefined_t";
      case ts.SyntaxKind.ObjectKeyword:
        return "js::object";

      case ts.SyntaxKind.TypeReference: {
        const typeRef = node as ts.TypeReferenceNode;
        if (ts.isIdentifier(typeRef.typeName)) {
          return typeRef.typeName.text;
        }
        return "unknown";
      }

      case ts.SyntaxKind.ArrayType: {
        const arrayType = node as ts.ArrayTypeNode;
        const elementType = this.resolveTypeNode(arrayType.elementType);
        return `js::array<${elementType}>`;
      }

      case ts.SyntaxKind.UnionType: {
        const unionType = node as ts.UnionTypeNode;
        const types = unionType.types.map((t) => this.resolveTypeNode(t));
        return `std::variant<${types.join(", ")}>`;
      }

      case ts.SyntaxKind.IntersectionType: {
        const intersectionType = node as ts.IntersectionTypeNode;
        const types = intersectionType.types.map((t) => this.resolveTypeNode(t));
        return types.join(" & ");
      }

      default:
        return "unknown";
    }
  }

  private mapKeywordType(kind: string): string {
    const mapping: Record<string, string> = {
      "TsStringKeyword": "string",
      "TsNumberKeyword": "number",
      "TsBooleanKeyword": "boolean",
      "TsVoidKeyword": "void",
      "TsAnyKeyword": "any",
      "TsUnknownKeyword": "unknown",
      "TsNeverKeyword": "never",
      "TsNullKeyword": "null",
      "TsUndefinedKeyword": "undefined",
      "TsObjectKeyword": "object",
    };

    return mapping[kind] || "unknown";
  }

  private resolveIdentifierType(name: string): string {
    // Walk scope stack to find variable
    for (let i = this.context.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.context.scopeStack[i];
      const node = scope.get(name);

      if (node) {
        if ("type" in node) {
          return (node as any).type;
        }
      }
    }

    return "unknown";
  }

  private pushScope(): void {
    this.context.scopeStack.push(new Map());
  }

  private popScope(): void {
    this.context.scopeStack.pop();
  }

  private addToScope(name: string, node: IRNode): void {
    const currentScope = this.context.scopeStack[this.context.scopeStack.length - 1];
    currentScope.set(name, node);
  }

  private warn(message: string): void {
    this.context.warnings.push({
      code: "TRANSFORM_WARNING",
      message,
      severity: "warning",
    });
  }

  /**
   * Convert memory annotation to IR memory management enum
   */
  private convertMemoryAnnotation(annotation: MemoryAnnotation): MemoryManagement {
    switch (annotation) {
      case MemoryAnnotation.Weak:
        return MemoryManagement.Weak;
      case MemoryAnnotation.Unique:
        return MemoryManagement.Unique;
      case MemoryAnnotation.Shared:
        return MemoryManagement.Shared;
      case MemoryAnnotation.None:
      default:
        return MemoryManagement.Auto;
    }
  }

  /**
   * Get line number from AST node span
   */
  private getLineNumber(node: any): number {
    if (!node.span?.start || !this.options.source) {
      return 1;
    }

    // Convert byte offset to line number
    const source = this.options.source;
    const offset = node.span.start;
    let lineNumber = 1;

    for (let i = 0; i < offset && i < source.length; i++) {
      if (source[i] === "\n") {
        lineNumber++;
      }
    }

    return lineNumber;
  }
}
