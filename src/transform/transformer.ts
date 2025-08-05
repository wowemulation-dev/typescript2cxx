/**
 * AST to IR transformer
 */

import { MemoryAnnotation, MemoryAnnotationParser } from "../memory/annotations.ts";
import type {
  IRArrayExpression,
  IRAssignmentExpression,
  IRBinaryExpression,
  IRBlockStatement,
  IRCallExpression,
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

  /** Type resolver */
  typeResolver?: any;

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
}

/**
 * Transform TypeScript AST to IR
 */
export function transformToIR(
  ast: any,
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
    };
  }

  /**
   * Transform the AST to IR
   */
  transform(ast: any): IRProgram {
    // Transform the module body
    if (ast.body) {
      for (const item of ast.body) {
        const stmt = this.transformModuleItem(item);
        if (stmt) {
          this.context.currentModule.body.push(stmt);
        }
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
  private transformModuleItem(node: any): IRStatement | null {
    switch (node.type) {
      case "ImportDeclaration":
        return this.transformImport(node);

      case "ExportDeclaration":
        return this.transformExport(node);

      case "FunctionDeclaration":
        return this.transformFunctionDeclaration(node);

      case "ClassDeclaration":
        return this.transformClassDeclaration(node);

      case "VariableDeclaration":
        return this.transformVariableDeclaration(node);

      case "TsInterfaceDeclaration":
        return this.transformInterfaceDeclaration(node);

      case "TsTypeAliasDeclaration":
        return this.transformTypeAlias(node);

      case "TsEnumDeclaration":
        return this.transformEnumDeclaration(node);

      case "ExpressionStatement":
        return this.transformExpressionStatement(node);

      case "IfStatement":
        return this.transformIfStatement(node);

      case "WhileStatement":
        return this.transformWhileStatement(node);

      case "ForStatement":
        return this.transformForStatement(node);

      case "ReturnStatement":
        return this.transformReturnStatement(node);

      case "BlockStatement":
        return this.transformBlockStatement(node);

      default:
        this.warn(`Unsupported module item type: ${node.type}`);
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
  private transformClassDeclaration(node: any): IRClassDeclaration {
    const name = node.identifier?.value || "anonymous";

    const cls: IRClassDeclaration = {
      kind: IRNodeKind.ClassDeclaration,
      id: { kind: IRNodeKind.Identifier, name },
      superClass: node.superClass ? this.transformExpression(node.superClass) : undefined,
      implements: [],
      members: [],
      isAbstract: false,
    };

    // Transform class body
    const prevClass = this.context.currentClass;
    this.context.currentClass = cls;
    this.pushScope();

    if (node.body) {
      for (const member of node.body) {
        const irMember = this.transformClassMember(member);
        if (irMember) {
          cls.members.push(irMember);
        }
      }
    }

    this.popScope();
    this.context.currentClass = prevClass;

    return cls;
  }

  /**
   * Transform class member
   */
  private transformClassMember(node: any): IRClassMember | null {
    switch (node.type) {
      case "ClassProperty":
      case "PropertyDefinition":
        return this.transformPropertyDefinition(node);

      case "MethodDefinition":
      case "ClassMethod":
        return this.transformMethodDefinition(node);

      case "Constructor":
        return this.transformConstructor(node);

      default:
        this.warn(`Unsupported class member type: ${node.type}`);
        return null;
    }
  }

  /**
   * Transform property definition
   */
  private transformPropertyDefinition(node: any): IRPropertyDefinition {
    const key = this.getPropertyNameAsExpression(node.key);
    const propertyName = this.getPropertyName(node.key);

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
      key,
      type: this.resolveType(node.typeAnnotation),
      value: node.value ? this.transformExpression(node.value) : undefined,
      accessibility: this.getAccessibility(node),
      isStatic: node.static || false,
      isReadonly: node.readonly || false,
      memory,
    };
  }

  /**
   * Transform method definition
   */
  private transformMethodDefinition(node: any): IRMethodDefinition {
    const key = this.getPropertyNameAsExpression(node.key);

    // Handle both MethodDefinition and ClassMethod nodes
    const funcNode = node.function || node.value || node;
    const params = this.transformParameters(funcNode.params || []);
    const returnType = this.resolveType(funcNode.returnType);

    // Create the function declaration for the method
    const funcDecl: IRFunctionDeclaration = {
      kind: IRNodeKind.FunctionDeclaration,
      id: null,
      params,
      returnType,
      body: null as any,
      isAsync: funcNode.async || false,
      isGenerator: funcNode.generator || false,
      isStatic: node.static || false,
    };

    // Transform body
    if (funcNode.body) {
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

      funcDecl.body = this.transformBlockStatement(funcNode.body);

      this.popScope();
      this.context.currentFunction = prevFunc;
    }

    const method: IRMethodDefinition = {
      kind: IRNodeKind.FunctionDeclaration,
      key,
      value: funcDecl,
      accessibility: this.getAccessibility(node),
      isStatic: node.static || false,
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
   * Transform variable declaration
   */
  private transformVariableDeclaration(node: any): IRVariableDeclaration {
    const declarations: IRVariableDeclarator[] = [];

    for (const decl of node.declarations) {
      const id: IRIdentifier = {
        kind: IRNodeKind.Identifier,
        name: decl.id?.value || "unknown",
      };

      const declarator: IRVariableDeclarator = {
        id,
        cppType: this.resolveType(decl.id?.typeAnnotation),
        init: decl.init ? this.transformExpression(decl.init) : undefined,
        memory: MemoryManagement.Auto,
      };

      declarations.push(declarator);
      this.addToScope(id.name, id);
    }

    return {
      kind: IRNodeKind.VariableDeclaration,
      declarationKind: node.kind === "const" ? "const" : node.kind === "let" ? "let" : "var",
      declarations,
    };
  }

  /**
   * Transform interface declaration
   */
  private transformInterfaceDeclaration(node: any): IRInterfaceDeclaration {
    return {
      kind: IRNodeKind.InterfaceDeclaration,
      id: { kind: IRNodeKind.Identifier, name: node.id?.value || "unknown" },
      extends: [],
      body: {
        body: [],
      },
    };
  }

  /**
   * Transform type alias
   */
  private transformTypeAlias(_node: any): IRExpressionStatement {
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
  private transformForInit(node: any): IRVariableDeclaration | IRExpression {
    if (node.type === "VariableDeclaration") {
      return this.transformVariableDeclaration(node);
    }
    return this.transformExpression(node);
  }

  /**
   * Transform return statement
   */
  private transformReturnStatement(node: any): IRReturnStatement {
    return {
      kind: IRNodeKind.ReturnStatement,
      argument: node.argument ? this.transformExpression(node.argument) : undefined,
    };
  }

  /**
   * Transform block statement
   */
  private transformBlockStatement(node: any): IRBlockStatement {
    this.pushScope();

    const statements: IRStatement[] = [];

    if (node.stmts || node.body) {
      const items = node.stmts || node.body;
      for (const stmt of items) {
        const irStmt = this.transformStatement(stmt);
        if (irStmt) {
          statements.push(irStmt);
        }
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
  private transformStatement(node: any): IRStatement {
    switch (node.type) {
      case "BlockStatement":
        return this.transformBlockStatement(node);
      case "ExpressionStatement":
        return this.transformExpressionStatement(node);
      case "IfStatement":
        return this.transformIfStatement(node);
      case "WhileStatement":
        return this.transformWhileStatement(node);
      case "ForStatement":
        return this.transformForStatement(node);
      case "ReturnStatement":
        return this.transformReturnStatement(node);
      case "VariableDeclaration":
        return this.transformVariableDeclaration(node);
      default: {
        this.warn(`Unsupported statement type: ${node.type}`);
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
  private transformExpression(node: any): IRExpression {
    if (!node) {
      return this.createLiteral(null);
    }

    switch (node.type) {
      case "Identifier":
        return this.transformIdentifier(node);

      case "StringLiteral":
      case "NumericLiteral":
      case "BooleanLiteral":
      case "NullLiteral":
        return this.transformLiteral(node);

      case "ArrayExpression":
        return this.transformArrayExpression(node);

      case "ObjectExpression":
        return this.transformObjectExpression(node);

      case "CallExpression":
        return this.transformCallExpression(node);

      case "MemberExpression":
        return this.transformMemberExpression(node);

      case "OptionalChainingExpression":
        return this.transformOptionalChainingExpression(node);

      case "BinaryExpression":
        return this.transformBinaryExpression(node);

      case "UnaryExpression":
        return this.transformUnaryExpression(node);

      case "AssignmentExpression":
        return this.transformAssignmentExpression(node);

      case "ConditionalExpression":
        return this.transformConditionalExpression(node);

      case "TemplateLiteral":
        return this.transformTemplateLiteral(node);

      case "ArrowFunctionExpression":
        return this.transformArrowFunction(node);

      case "ThisExpression":
        return this.transformThisExpression(node);

      case "NewExpression":
        return this.transformNewExpression(node);

      case "UpdateExpression":
        return this.transformUpdateExpression(node);

      default:
        this.warn(`Unsupported expression type: ${node.type}`);
        return this.createLiteral(null);
    }
  }

  /**
   * Transform identifier
   */
  private transformIdentifier(node: any): IRIdentifier {
    return {
      kind: IRNodeKind.Identifier,
      name: node.value,
    };
  }

  /**
   * Transform literal
   */
  private transformLiteral(node: any): IRLiteral {
    let value: any;
    let type: string;

    switch (node.type) {
      case "StringLiteral":
        value = node.value;
        type = "string";
        break;
      case "NumericLiteral":
        value = node.value;
        type = "number";
        break;
      case "BooleanLiteral":
        value = node.value;
        type = "boolean";
        break;
      case "NullLiteral":
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
  private transformArrayExpression(node: any): IRArrayExpression {
    const elements: IRExpression[] = [];

    if (node.elements) {
      for (const elem of node.elements) {
        if (elem?.expression) {
          elements.push(this.transformExpression(elem.expression));
        } else if (elem) {
          elements.push(this.transformExpression(elem));
        }
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
  private transformObjectExpression(node: any): IRObjectExpression {
    const properties: IRObjectProperty[] = [];

    if (node.properties) {
      for (const prop of node.properties) {
        if (prop.type === "KeyValueProperty") {
          properties.push({
            key: this.getPropertyKeyAsExpression(prop.key),
            value: this.transformExpression(prop.value),
            kind: "init",
            computed: prop.computed || false,
            method: false,
            shorthand: false,
          });
        }
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
  private transformCallExpression(node: any): IRCallExpression {
    const args: IRExpression[] = [];

    if (node.arguments) {
      for (const arg of node.arguments) {
        args.push(this.transformExpression(arg.expression));
      }
    }

    return {
      kind: IRNodeKind.CallExpression,
      callee: this.transformExpression(node.callee),
      arguments: args,
      optional: false, // TODO: Detect optional chaining
    };
  }

  /**
   * Transform member expression
   */
  private transformMemberExpression(node: any): IRMemberExpression {
    // Check if this is computed access (array[index])
    const isComputed = node.property && node.property.type === "Computed";

    let property: IRExpression;
    if (isComputed) {
      // For computed access, use the expression inside the Computed node
      property = this.transformExpression(node.property.expression);
    } else {
      property = this.transformExpression(node.property);
    }

    return {
      kind: IRNodeKind.MemberExpression,
      object: this.transformExpression(node.object),
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
  private transformBinaryExpression(node: any): IRBinaryExpression {
    const op = this.mapBinaryOperator(node.operator);

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
    // Handle template literals with expressions
    if (!node.expressions || node.expressions.length === 0) {
      // Simple template literal without expressions
      const value = (node.quasis || []).map((quasi: any) => quasi.cooked || "").join("");
      return this.createLiteral(value);
    }

    // Template literal with expressions - create a template literal IR node
    const parts: Array<IRExpression | IRLiteral> = [];

    // Interleave quasis (literal parts) and expressions
    for (let i = 0; i < node.quasis.length; i++) {
      const quasi = node.quasis[i];
      // Add literal part if it's not empty
      if (quasi.cooked && quasi.cooked !== "") {
        parts.push(this.createLiteral(quasi.cooked));
      }

      // Add expression if it exists
      if (i < node.expressions.length) {
        parts.push(this.transformExpression(node.expressions[i]));
      }
    }

    return {
      kind: IRNodeKind.TemplateLiteral,
      parts,
    } as IRTemplateLiteral;
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
   * Transform new expression
   */
  private transformNewExpression(node: any): IRNewExpression {
    const args: IRExpression[] = [];

    if (node.arguments) {
      for (const arg of node.arguments) {
        args.push(this.transformExpression(arg.expression));
      }
    }

    return {
      kind: IRNodeKind.NewExpression,
      callee: this.transformExpression(node.callee),
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

  private getPropertyName(key: any): string {
    if (key.type === "Identifier") {
      return key.value;
    }
    if (key.type === "StringLiteral") {
      return key.value;
    }
    return "unknown";
  }

  private getPropertyNameAsExpression(key: any): IRIdentifier | IRLiteral {
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

  private resolveType(typeAnnotation: any): string {
    if (!typeAnnotation) return "auto";

    if (typeAnnotation.typeAnnotation) {
      return this.resolveTypeNode(typeAnnotation.typeAnnotation);
    }

    return "unknown";
  }

  private resolveTypeNode(node: any): string {
    if (!node) return "unknown";

    switch (node.type) {
      case "TsKeywordType":
        return this.mapKeywordType(node.kind);

      case "TsTypeReference":
        return node.typeName?.value || "unknown";

      case "TsArrayType":
        return `${this.resolveTypeNode(node.elemType)}[]`;

      case "TsUnionType":
        return node.types.map((t: any) => this.resolveTypeNode(t)).join(" | ");

      case "TsIntersectionType":
        return node.types.map((t: any) => this.resolveTypeNode(t)).join(" & ");

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
