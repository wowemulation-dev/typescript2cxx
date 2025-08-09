/**
 * AST to IR transformer
 */

import { ts } from "../ast/parser.ts";
import { MemoryAnnotation, MemoryAnnotationParser } from "../memory/annotations.ts";
import type { SimpleTypeChecker } from "../type-checker/simple-checker.ts";
import type {
  IRArrayExpression,
  IRArrayPattern,
  IRAssignmentExpression,
  IRAwaitExpression,
  IRBinaryExpression,
  IRBlockStatement,
  IRBreakStatement,
  IRCallExpression,
  IRCatchClause,
  IRClassDeclaration,
  IRClassMember,
  IRConditionalExpression,
  IRContinueStatement,
  IRDeclaration as _IRDeclaration,
  IRDecorator,
  IRDecoratorMetadata,
  IREnumDeclaration,
  IREnumMember,
  IRExportAllDeclaration,
  IRExportDeclaration,
  IRExportDefaultDeclaration,
  IRExportNamedDeclaration,
  IRExportSpecifier,
  IRExpression,
  IRExpressionStatement,
  IRForInStatement,
  IRForOfStatement,
  IRForStatement,
  IRFunctionDeclaration,
  IRIdentifier,
  IRIfStatement,
  IRImportDeclaration,
  IRImportDefaultSpecifier,
  IRImportNamespaceSpecifier,
  IRImportSpecifier,
  IRInterfaceDeclaration,
  IRLiteral,
  IRMemberExpression,
  IRMethodDefinition,
  IRModule,
  IRNamedImportSpecifier,
  IRNamespaceDeclaration,
  IRNewExpression,
  IRNode,
  IRObjectExpression,
  IRObjectPattern,
  IRObjectPatternProperty,
  IRObjectProperty,
  IROptionalChainingExpression,
  IRParameter,
  IRPattern,
  IRProgram,
  IRPropertyDefinition,
  IRRestElement,
  IRReturnStatement,
  IRSpreadElement,
  IRStatement,
  IRSwitchCase,
  IRSwitchStatement,
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
  | "??"
  | "**"
  | "instanceof"
  | "in";

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
        return this.transformImportDeclaration(node as ts.ImportDeclaration);

      case ts.SyntaxKind.ExportDeclaration:
        return this.transformExportDeclaration(node as ts.ExportDeclaration);
      
      case ts.SyntaxKind.ExportAssignment:
        return this.transformExportAssignment(node as ts.ExportAssignment);

      case ts.SyntaxKind.ModuleDeclaration:
        return this.transformNamespaceDeclaration(node as ts.ModuleDeclaration);

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

      case ts.SyntaxKind.SwitchStatement:
        return this.transformSwitchStatement(node as ts.SwitchStatement);

      case ts.SyntaxKind.WhileStatement:
        return this.transformWhileStatement(node as ts.WhileStatement);

      case ts.SyntaxKind.ForStatement:
        return this.transformForStatement(node as ts.ForStatement);

      case ts.SyntaxKind.ReturnStatement:
        return this.transformReturnStatement(node as ts.ReturnStatement);

      case ts.SyntaxKind.BreakStatement:
        return this.transformBreakStatement(node as ts.BreakStatement);

      case ts.SyntaxKind.ContinueStatement:
        return this.transformContinueStatement(node as ts.ContinueStatement);

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
  private transformImportDeclaration(node: ts.ImportDeclaration): IRImportDeclaration | null {
    const source = node.moduleSpecifier;
    if (!ts.isStringLiteral(source)) {
      this.warn("Dynamic imports are not supported");
      return null;
    }

    const specifiers: IRImportSpecifier[] = [];
    
    if (node.importClause) {
      const { name: defaultBinding, namedBindings } = node.importClause;
      
      // Handle default import (import Foo from "module")
      if (defaultBinding) {
        specifiers.push({
          type: "default",
          local: defaultBinding.text,
        });
      }
      
      // Handle named and namespace imports
      if (namedBindings) {
        if (ts.isNamespaceImport(namedBindings)) {
          // import * as Foo from "module"
          specifiers.push({
            type: "namespace",
            local: namedBindings.name.text,
          });
        } else if (ts.isNamedImports(namedBindings)) {
          // import { Foo, Bar as Baz } from "module"
          for (const element of namedBindings.elements) {
            specifiers.push({
              type: "named",
              imported: element.propertyName?.text || element.name.text,
              local: element.name.text,
            });
          }
        }
      }
    }
    
    // Track import for header generation
    this.context.currentModule.imports.push({
      from: source.text,
      items: specifiers.map(spec => ({
        imported: spec.type === "named" ? (spec as IRNamedImportSpecifier).imported : spec.local,
        local: spec.local,
        isType: false,
      })),
      isNamespace: specifiers.some(s => s.type === "namespace"),
      namespace: specifiers.find(s => s.type === "namespace")?.local,
    });

    return {
      kind: IRNodeKind.ImportDeclaration,
      source: source.text,
      specifiers,
      isTypeOnly: false,
      location: this.getLocation(node),
    };
  }

  /**
   * Transform export declaration
   */
  private transformExportDeclaration(node: ts.ExportDeclaration): IRExportNamedDeclaration | IRExportAllDeclaration | null {
    const source = node.moduleSpecifier;
    const sourceText = source && ts.isStringLiteral(source) ? source.text : undefined;
    
    if (node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        // export { Foo, Bar as Baz } from "module" or export { Foo, Bar as Baz }
        const specifiers: IRExportSpecifier[] = [];
        
        for (const element of node.exportClause.elements) {
          const local = element.propertyName?.text || element.name.text;
          const exported = element.name.text;
          
          specifiers.push({ local, exported });
          
          // Track exported name
          this.context.currentModule.exports.push(exported);
        }
        
        // For re-exports, also track as an import
        if (sourceText) {
          this.context.currentModule.imports.push({
            from: sourceText,
            items: specifiers.map(spec => ({
              imported: spec.local,
              local: spec.exported,
              isType: false,
            })),
            isNamespace: false,
          });
        }
        
        return {
          kind: IRNodeKind.ExportNamedDeclaration,
          specifiers,
          source: sourceText,
          location: this.getLocation(node),
        };
      }
    } else if (sourceText) {
      // export * from "module"
      // Track as import for header generation
      this.context.currentModule.imports.push({
        from: sourceText,
        items: [],
        isNamespace: false,
      });
      
      return {
        kind: IRNodeKind.ExportAllDeclaration,
        source: sourceText,
        location: this.getLocation(node),
      };
    }
    
    return null;
  }

  /**
   * Transform export assignment (export = or export default)
   */
  private transformExportAssignment(node: ts.ExportAssignment): IRExportDefaultDeclaration | null {
    if (!node.isExportEquals) {
      // export default expression
      const declaration = this.transformExpression(node.expression);
      
      this.context.currentModule.exports.push("default");
      
      return {
        kind: IRNodeKind.ExportDefaultDeclaration,
        declaration,
        location: this.getLocation(node),
      };
    }
    
    // export = syntax is not supported in ES modules
    this.warn("CommonJS export= syntax is not supported");
    return null;
  }

  /**
   * Transform namespace declaration
   */
  private transformNamespaceDeclaration(node: ts.ModuleDeclaration): IRNamespaceDeclaration | null {
    if (!node.name || !node.body) {
      return null;
    }
    
    const name = ts.isIdentifier(node.name) ? node.name.text : node.name.text;
    const body: IRStatement[] = [];
    
    // Handle dotted namespace names (e.g., A.B.C)
    const nested: string[] = [];
    if (ts.isQualifiedName(node.name)) {
      // Extract nested namespace parts
      let current: ts.EntityName = node.name;
      while (ts.isQualifiedName(current)) {
        nested.unshift(current.right.text);
        current = current.left;
      }
      nested.unshift(ts.isIdentifier(current) ? current.text : (current as ts.StringLiteral).text);
    }
    
    // Process namespace body
    if (ts.isModuleBlock(node.body)) {
      for (const statement of node.body.statements) {
        const stmt = this.transformModuleItem(statement);
        if (stmt) {
          body.push(stmt);
        }
      }
    } else if (ts.isModuleDeclaration(node.body)) {
      // Nested namespace declaration
      const nestedNs = this.transformNamespaceDeclaration(node.body);
      if (nestedNs) {
        body.push(nestedNs);
      }
    }
    
    const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
    
    return {
      kind: IRNodeKind.NamespaceDeclaration,
      name,
      body,
      isExported,
      nested: nested.length > 1 ? nested : undefined,
      location: this.getLocation(node),
    };
  }

  /**
   * Transform function declaration
   */
  private transformFunctionDeclaration(node: any): IRFunctionDeclaration {
    const name = node.name?.text || "anonymous";
    const params = this.transformParameters(node.parameters || []);
    const returnType = this.resolveType(node.type);

    // Check if function is async
    const isAsync = node.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.AsyncKeyword) ||
      false;
    
    // Check if function is exported
    const isExported = node.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword) ||
      false;
    
    // Track exported function
    if (isExported) {
      this.context.currentModule.exports.push(name);
    }

    const func: IRFunctionDeclaration = {
      kind: IRNodeKind.FunctionDeclaration,
      id: { kind: IRNodeKind.Identifier, name },
      params,
      returnType,
      body: null as any,
      isAsync,
      isGenerator: false,
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
    
    // Check if class is exported
    const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ||
      false;
    
    // Track exported class
    if (isExported) {
      this.context.currentModule.exports.push(name);
    }

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

    // Collect class decorators
    const decoratorMetadata = this.collectDecoratorMetadata(node);
    if (decoratorMetadata) {
      cls.decorators = decoratorMetadata;
    }

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

    // Transform body (skip for abstract methods)
    const isAbstract = !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword);
    if (node.body && !isAbstract) {
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
    } else if (!node.body && !isAbstract) {
      // Non-abstract methods without a body should have an empty body
      funcDecl.body = {
        kind: IRNodeKind.BlockStatement,
        body: [],
      };
    }

    const method: IRMethodDefinition = {
      kind: IRNodeKind.FunctionDeclaration,
      key: key as (IRIdentifier | IRLiteral),
      value: funcDecl,
      accessibility: this.getAccessModifierFromNode(node),
      isStatic: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
      isAbstract: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword),
    };

    return method;
  }

  /**
   * Transform constructor
   */
  private transformConstructor(node: any): IRMethodDefinition {
    const params = this.transformParameters(node.parameters || []);

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
    
    // Check if variables are exported
    const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ||
      false;

    for (const decl of node.declarationList.declarations) {
      // Handle both simple identifiers and destructuring patterns
      let id: IRIdentifier | IRPattern;

      if (ts.isIdentifier(decl.name)) {
        id = {
          kind: IRNodeKind.Identifier,
          name: decl.name.text,
        };
        this.addToScope(decl.name.text, id as IRIdentifier);
        
        // Track exported variables
        if (isExported) {
          this.context.currentModule.exports.push(decl.name.text);
        }
      } else if (ts.isObjectBindingPattern(decl.name)) {
        id = this.transformObjectBindingPattern(decl.name);
      } else if (ts.isArrayBindingPattern(decl.name)) {
        id = this.transformArrayBindingPattern(decl.name);
      } else {
        // Fallback for unknown patterns
        id = {
          kind: IRNodeKind.Identifier,
          name: "unknown",
        };
      }

      const declarator: IRVariableDeclarator = {
        id,
        cppType: decl.type ? this.resolveTypeForDeclaration(decl) : "auto",
        init: decl.initializer ? this.transformExpression(decl.initializer) : undefined,
        memory: MemoryManagement.Auto,
      };

      declarations.push(declarator);
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
  private transformEnumDeclaration(node: ts.EnumDeclaration): IREnumDeclaration {
    const members: IREnumMember[] = [];

    for (const member of node.members) {
      const memberNode: IREnumMember = {
        kind: IRNodeKind.EnumDeclaration, // Enum members don't have their own kind, use parent's
        id: {
          kind: IRNodeKind.Identifier,
          name: member.name?.getText() || "",
        },
      };

      if (member.initializer) {
        memberNode.initializer = this.transformExpression(member.initializer);
      }

      members.push(memberNode);
    }

    return {
      kind: IRNodeKind.EnumDeclaration,
      id: {
        kind: IRNodeKind.Identifier,
        name: node.name?.text || "",
      },
      members,
      isConst: node.modifiers?.some(
        (mod) => mod.kind === ts.SyntaxKind.ConstKeyword,
      ) || false,
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
  private transformIfStatement(node: ts.IfStatement): IRIfStatement {
    const test = this.transformExpression(node.expression);
    return {
      kind: IRNodeKind.IfStatement,
      test: test,
      consequent: this.transformStatement(node.thenStatement),
      alternate: node.elseStatement ? this.transformStatement(node.elseStatement) : undefined,
    };
  }

  /**
   * Transform switch statement
   */
  private transformSwitchStatement(node: ts.SwitchStatement): IRSwitchStatement {
    const cases: IRSwitchCase[] = node.caseBlock.clauses.map((clause) => {
      if (ts.isDefaultClause(clause)) {
        return {
          test: null,
          consequent: clause.statements.map((stmt) => this.transformStatement(stmt)),
        } as IRSwitchCase;
      } else {
        return {
          test: this.transformExpression(clause.expression),
          consequent: clause.statements.map((stmt) => this.transformStatement(stmt)),
        } as IRSwitchCase;
      }
    });

    return {
      kind: IRNodeKind.SwitchStatement,
      discriminant: this.transformExpression(node.expression),
      cases,
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
  private transformForStatement(node: ts.ForStatement): IRForStatement {
    this.pushScope();

    const forStmt: IRForStatement = {
      kind: IRNodeKind.ForStatement,
      init: node.initializer ? this.transformForInit(node.initializer) : undefined,
      test: node.condition ? this.transformExpression(node.condition) : undefined,
      update: node.incrementor ? this.transformExpression(node.incrementor) : undefined,
      body: this.transformStatement(node.statement),
    };

    this.popScope();

    return forStmt;
  }

  /**
   * Transform for...of statement
   */
  private transformForOfStatement(node: ts.ForOfStatement): IRForOfStatement {
    this.pushScope();

    const forOfStmt: IRForOfStatement = {
      kind: IRNodeKind.ForOfStatement,
      left: this.transformForOfLeft(node.initializer),
      right: this.transformExpression(node.expression),
      body: this.transformStatement(node.statement),
      isAsync: node.awaitModifier !== undefined,
    };

    this.popScope();
    return forOfStmt;
  }

  /**
   * Transform for...in statement
   */
  private transformForInStatement(node: ts.ForInStatement): IRForInStatement {
    this.pushScope();

    const forInStmt: IRForInStatement = {
      kind: IRNodeKind.ForInStatement,
      left: this.transformForInLeft(node.initializer),
      right: this.transformExpression(node.expression),
      body: this.transformStatement(node.statement),
    };

    this.popScope();
    return forInStmt;
  }

  /**
   * Transform for loop initializer
   */
  private transformForInit(node: ts.ForInitializer): IRVariableDeclaration | IRExpression {
    if (ts.isVariableDeclarationList(node)) {
      // Create a synthetic variable statement to reuse existing logic
      const varStmt = ts.factory.createVariableStatement(
        undefined,
        node,
      );
      return this.transformVariableStatement(varStmt);
    }
    return this.transformExpression(node as ts.Expression);
  }

  /**
   * Transform for...of left side (variable declaration or identifier)
   */
  private transformForOfLeft(node: ts.ForInitializer): IRVariableDeclaration | IRPattern {
    if (ts.isVariableDeclarationList(node)) {
      // Create a synthetic variable statement for for...of
      const varStmt = ts.factory.createVariableStatement(
        undefined,
        node,
      );
      return this.transformVariableStatement(varStmt);
    }
    // For now, handle simple identifier cases
    // TODO: Add full pattern support later
    if (ts.isIdentifier(node)) {
      return this.transformIdentifier(node);
    }
    // Fallback for now - should add proper pattern support
    throw new Error(`Unsupported for...of pattern: ${ts.SyntaxKind[node.kind]}`);
  }

  /**
   * Transform for...in left side (variable declaration or identifier)
   */
  private transformForInLeft(node: ts.ForInitializer): IRVariableDeclaration | IRPattern {
    if (ts.isVariableDeclarationList(node)) {
      // Create a synthetic variable statement for for...in
      const varStmt = ts.factory.createVariableStatement(
        undefined,
        node,
      );
      return this.transformVariableStatement(varStmt);
    }
    // For now, handle simple identifier cases
    // TODO: Add full pattern support later
    if (ts.isIdentifier(node)) {
      return this.transformIdentifier(node);
    }
    // Fallback for now - should add proper pattern support
    throw new Error(`Unsupported for...in pattern: ${ts.SyntaxKind[node.kind]}`);
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
   * Transform break statement
   */
  private transformBreakStatement(node: ts.BreakStatement): IRBreakStatement {
    return {
      kind: IRNodeKind.BreakStatement,
      label: node.label ? node.label.text : undefined,
    };
  }

  /**
   * Transform continue statement
   */
  private transformContinueStatement(node: ts.ContinueStatement): IRContinueStatement {
    return {
      kind: IRNodeKind.ContinueStatement,
      label: node.label ? node.label.text : undefined,
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
    if (!node) {
      // Return an empty block statement for undefined nodes
      const emptyBlock: IRBlockStatement = {
        kind: IRNodeKind.BlockStatement,
        body: [],
      };
      return emptyBlock;
    }
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        return this.transformBlockStatement(node as ts.Block);
      case ts.SyntaxKind.ExpressionStatement:
        return this.transformExpressionStatement(node as ts.ExpressionStatement);
      case ts.SyntaxKind.IfStatement:
        return this.transformIfStatement(node as ts.IfStatement);
      case ts.SyntaxKind.SwitchStatement:
        return this.transformSwitchStatement(node as ts.SwitchStatement);
      case ts.SyntaxKind.WhileStatement:
        return this.transformWhileStatement(node as ts.WhileStatement);
      case ts.SyntaxKind.ForStatement:
        return this.transformForStatement(node as ts.ForStatement);
      case ts.SyntaxKind.ForOfStatement:
        return this.transformForOfStatement(node as ts.ForOfStatement);
      case ts.SyntaxKind.ForInStatement:
        return this.transformForInStatement(node as ts.ForInStatement);
      case ts.SyntaxKind.ReturnStatement:
        return this.transformReturnStatement(node as ts.ReturnStatement);
      case ts.SyntaxKind.BreakStatement:
        return this.transformBreakStatement(node as ts.BreakStatement);
      case ts.SyntaxKind.ContinueStatement:
        return this.transformContinueStatement(node as ts.ContinueStatement);
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

      case ts.SyntaxKind.FunctionExpression:
        return this.transformFunctionExpression(node as ts.FunctionExpression);

      case ts.SyntaxKind.ThisKeyword:
        return this.transformThisExpression(node);

      case ts.SyntaxKind.SuperKeyword:
        return this.transformSuperExpression(node);

      case ts.SyntaxKind.NewExpression:
        return this.transformNewExpression(node as ts.NewExpression);

      case ts.SyntaxKind.AwaitExpression:
        return this.transformAwaitExpression(node as ts.AwaitExpression);

      case ts.SyntaxKind.TypeOfExpression:
        return this.transformTypeOfExpression(node as ts.TypeOfExpression);

      case ts.SyntaxKind.SpreadElement:
        return this.transformSpreadElement(node as ts.SpreadElement);

      case ts.SyntaxKind.ParenthesizedExpression:
        // Parenthesized expressions just pass through the inner expression
        return this.transformExpression((node as ts.ParenthesizedExpression).expression);

      case ts.SyntaxKind.DeleteExpression:
        return this.transformDeleteExpression(node as ts.DeleteExpression);

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
    const elements: (IRExpression | null)[] = [];

    for (const elem of node.elements) {
      if (ts.isSpreadElement(elem)) {
        // Transform spread element
        const spreadElem: IRSpreadElement = {
          kind: IRNodeKind.SpreadElement,
          argument: this.transformExpression(elem.expression),
        };
        elements.push(spreadElem);
      } else if (ts.isOmittedExpression(elem)) {
        // Handle array holes
        elements.push(null);
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
    // Check if this is a dynamic import call
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      // Handle dynamic import
      if (node.arguments.length > 0) {
        const moduleArg = node.arguments[0];
        if (ts.isStringLiteral(moduleArg)) {
          // Track as import for header generation
          this.context.currentModule.imports.push({
            from: moduleArg.text,
            items: [],
            isNamespace: false,
          });
        }
      }
      // For now, still generate the call expression (it will be transformed in codegen)
    }

    const args: IRExpression[] = [];

    for (const arg of node.arguments) {
      if (ts.isSpreadElement(arg)) {
        // Transform spread argument
        args.push(this.transformSpreadElement(arg));
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
      
      // Special handling for string literal method names to avoid TypeScript resolution
      if (ts.isStringLiteral(elementAccess.argumentExpression)) {
        property = {
          kind: IRNodeKind.Literal,
          value: elementAccess.argumentExpression.text,
        } as IRLiteral;
      } else if (ts.isIdentifier(elementAccess.argumentExpression)) {
        // For identifiers, use .text to avoid resolution to implementation strings
        property = {
          kind: IRNodeKind.Identifier,
          name: elementAccess.argumentExpression.text,
        } as IRIdentifier;
      } else {
        property = this.transformExpression(elementAccess.argumentExpression);
      }
    } else {
      // For property access, extract the property name directly
      // Use .text to avoid TypeScript resolving method names to their implementations
      const propertyAccess = node as ts.PropertyAccessExpression;
      property = {
        kind: IRNodeKind.Identifier,
        name: propertyAccess.name.text,
      } as IRIdentifier;
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
  private transformUnaryExpression(
    node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression
  ): IRUnaryExpression {
    const op = this.mapUnaryOperator(node.operator);

    return {
      kind: IRNodeKind.UnaryExpression,
      operator: op,
      operand: this.transformExpression(node.operand),
      prefix: ts.isPrefixUnaryExpression(node),
    };
  }

  /**
   * Transform typeof expression
   */
  private transformTypeOfExpression(node: ts.TypeOfExpression): IRUnaryExpression {
    return {
      kind: IRNodeKind.UnaryExpression,
      operator: "typeof",
      operand: this.transformExpression(node.expression),
      prefix: true,
    };
  }

  /**
   * Transform spread element (...expr)
   */
  private transformSpreadElement(node: ts.SpreadElement): IRSpreadElement {
    return {
      kind: IRNodeKind.SpreadElement,
      argument: this.transformExpression(node.expression),
    };
  }

  /**
   * Transform delete expression (delete obj.prop)
   */
  private transformDeleteExpression(node: ts.DeleteExpression): IRUnaryExpression {
    return {
      kind: IRNodeKind.UnaryExpression,
      operator: "delete",
      operand: this.transformExpression(node.expression),
      prefix: true,
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
  private transformArrowFunction(node: ts.ArrowFunction): IRExpression {
    // Arrow functions are essentially function expressions with lexical this binding
    // We'll transform them as lambda functions in C++

    const params = this.transformParameters(Array.from(node.parameters || []));
    const returnType = this.resolveType(node.type);

    // Check if it's a simple expression body (implicit return)
    const isExpressionBody = node.body.kind !== ts.SyntaxKind.Block;

    let body: IRBlockStatement;
    if (isExpressionBody) {
      // For expression bodies like: x => x * 2
      // We need to wrap in a return statement
      const expr = this.transformExpression(node.body);
      body = {
        kind: IRNodeKind.BlockStatement,
        body: [{
          kind: IRNodeKind.ReturnStatement,
          argument: expr,
        } as IRReturnStatement],
      };
    } else {
      // Block body like: x => { return x * 2; }
      body = this.transformBlockStatement(node.body as ts.Block);
    }

    // Return as a function expression that will be generated as a lambda
    return {
      kind: IRNodeKind.FunctionExpression,
      id: null, // Arrow functions are anonymous
      params,
      returnType,
      body,
      isAsync: false,
      isGenerator: false,
      isArrow: true, // Mark as arrow function for proper this binding
    } as any;
  }

  /**
   * Transform function expression
   */
  private transformFunctionExpression(node: ts.FunctionExpression): IRExpression {
    // Function expressions are anonymous functions that can be called immediately (IIFE)
    const params = this.transformParameters(Array.from(node.parameters || []));
    const returnType = this.resolveType(node.type);

    let body: IRBlockStatement;
    if (node.body) {
      body = this.transformBlockStatement(node.body);
    } else {
      // Empty body
      body = {
        kind: IRNodeKind.BlockStatement,
        body: [],
      };
    }

    // Return as a function expression that will be generated as a lambda
    return {
      kind: IRNodeKind.FunctionExpression,
      id: node.name ? this.transformIdentifier(node.name) : null, // Function expressions can have optional names
      params,
      returnType,
      body,
      isAsync: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
      isGenerator: !!node.asteriskToken,
      isArrow: false, // Regular function expression, not arrow function
    } as any;
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
   * Transform await expression
   */
  private transformAwaitExpression(node: ts.AwaitExpression): IRAwaitExpression {
    return {
      kind: IRNodeKind.AwaitExpression,
      argument: this.transformExpression(node.expression),
    };
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
      // Handle TypeScript AST parameter nodes
      if (ts.isParameter(param)) {
        const name = param.name && ts.isIdentifier(param.name) ? param.name.text : "param";
        result.push({
          name,
          type: this.resolveType(param.type),
          defaultValue: param.initializer ? this.transformExpression(param.initializer) : undefined,
          isOptional: !!param.questionToken,
          isRest: !!param.dotDotDotToken,
          memory: MemoryManagement.Auto,
        });
      } else if (param.type === "Identifier") {
        // Fallback for old format
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

  private getPropertyKeyAsExpression(
    key: ts.PropertyName,
  ): IRIdentifier | IRLiteral | IRExpression {
    // Handle computed property names: [expression]
    if (ts.isComputedPropertyName(key)) {
      return this.transformExpression(key.expression);
    }

    // Handle regular identifiers: prop
    if (ts.isIdentifier(key)) {
      return {
        kind: IRNodeKind.Identifier,
        name: key.text,
      };
    }

    // Handle string literals: "prop"
    if (ts.isStringLiteral(key)) {
      return {
        kind: IRNodeKind.Literal,
        value: key.text,
        cppType: "string",
        raw: `"${key.text}"`,
        literalType: "string",
      };
    }

    // Handle numeric literals: 123
    if (ts.isNumericLiteral(key)) {
      const numValue = parseFloat(key.text);
      return {
        kind: IRNodeKind.Literal,
        value: numValue,
        cppType: "number",
        raw: key.text,
        literalType: "number",
      };
    }

    // Fallback for other cases
    return this.transformExpression(key as any);
  }

  private getAccessibility(node: any): "public" | "private" | "protected" | undefined {
    return node.accessibility;
  }

  private getAccessModifier(node: any): AccessModifier {
    if (node.accessibility === "private") return AccessModifier.Private;
    if (node.accessibility === "protected") return AccessModifier.Protected;
    return AccessModifier.Public;
  }

  /**
   * Transform object binding pattern (destructuring)
   */
  private transformObjectBindingPattern(node: ts.ObjectBindingPattern): IRObjectPattern {
    const properties: IRObjectPatternProperty[] = [];

    for (const element of node.elements) {
      if (ts.isBindingElement(element)) {
        const key = element.propertyName
          ? (ts.isIdentifier(element.propertyName)
            ? { kind: IRNodeKind.Identifier as const, name: element.propertyName.text }
            : {
              kind: IRNodeKind.Literal as const,
              value: (element.propertyName as ts.StringLiteral).text,
              cppType: "string",
              raw: `"${(element.propertyName as ts.StringLiteral).text}"`,
              literalType: "string" as const,
            })
          : (ts.isIdentifier(element.name)
            ? { kind: IRNodeKind.Identifier as const, name: element.name.text }
            : { kind: IRNodeKind.Identifier as const, name: "unknown" });

        let value: IRIdentifier | IRPattern;
        if (ts.isIdentifier(element.name)) {
          value = { kind: IRNodeKind.Identifier, name: element.name.text };
          this.addToScope(element.name.text, value as IRIdentifier);
        } else if (ts.isObjectBindingPattern(element.name)) {
          value = this.transformObjectBindingPattern(element.name);
        } else if (ts.isArrayBindingPattern(element.name)) {
          value = this.transformArrayBindingPattern(element.name);
        } else {
          value = { kind: IRNodeKind.Identifier, name: "unknown" };
        }

        const prop: IRObjectPatternProperty = {
          key,
          value,
          shorthand: !element.propertyName && ts.isIdentifier(element.name),
          rest: element.dotDotDotToken !== undefined,
        };

        // Handle default value
        if (element.initializer) {
          prop.defaultValue = this.transformExpression(element.initializer);
        }

        // Handle renamed property (propertyName exists and name is an identifier)
        if (element.propertyName && ts.isIdentifier(element.name)) {
          prop.renamed = element.name.text;
        }

        properties.push(prop);
      }
    }

    return {
      kind: IRNodeKind.ObjectPattern,
      properties,
    };
  }

  /**
   * Transform array binding pattern (destructuring)
   */
  private transformArrayBindingPattern(node: ts.ArrayBindingPattern): IRArrayPattern {
    const elements: (IRIdentifier | IRPattern | IRRestElement | null)[] = [];

    for (const element of node.elements) {
      if (ts.isOmittedExpression(element)) {
        elements.push(null);
      } else if (ts.isBindingElement(element)) {
        if (element.dotDotDotToken) {
          // Rest element
          let argument: IRIdentifier | IRPattern;
          if (ts.isIdentifier(element.name)) {
            argument = { kind: IRNodeKind.Identifier, name: element.name.text };
            this.addToScope(element.name.text, argument as IRIdentifier);
          } else if (ts.isObjectBindingPattern(element.name)) {
            argument = this.transformObjectBindingPattern(element.name);
          } else if (ts.isArrayBindingPattern(element.name)) {
            argument = this.transformArrayBindingPattern(element.name);
          } else {
            argument = { kind: IRNodeKind.Identifier, name: "unknown" };
          }

          elements.push({
            kind: IRNodeKind.RestElement,
            argument,
            cppType: "auto",
          });
        } else {
          // Regular element
          if (ts.isIdentifier(element.name)) {
            const id = { kind: IRNodeKind.Identifier as const, name: element.name.text };
            this.addToScope(element.name.text, id);
            elements.push(id);
          } else if (ts.isObjectBindingPattern(element.name)) {
            elements.push(this.transformObjectBindingPattern(element.name));
          } else if (ts.isArrayBindingPattern(element.name)) {
            elements.push(this.transformArrayBindingPattern(element.name));
          } else {
            elements.push({ kind: IRNodeKind.Identifier, name: "unknown" });
          }
        }
      }
    }

    return {
      kind: IRNodeKind.ArrayPattern,
      elements,
    };
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
      "**": "**",
      "instanceof": "instanceof",
      "in": "in",
    };

    return mapping[op] || "+";
  }

  private mapUnaryOperator(op: string | number): UnaryOp {
    const mapping: Record<string | number, UnaryOp> = {
      "+": "+",
      "-": "-",
      "!": "!",
      "~": "~",
      "++": "++",
      "--": "--",
      "typeof": "typeof",
      "void": "void",
      "delete": "delete",
      // TypeScript SyntaxKind mappings
      [ts.SyntaxKind.PlusToken]: "+",
      [ts.SyntaxKind.MinusToken]: "-",
      [ts.SyntaxKind.ExclamationToken]: "!",
      [ts.SyntaxKind.TildeToken]: "~",
      [ts.SyntaxKind.PlusPlusToken]: "++",
      [ts.SyntaxKind.MinusMinusToken]: "--",
      [ts.SyntaxKind.TypeOfKeyword]: "typeof",
      [ts.SyntaxKind.VoidKeyword]: "void",
      [ts.SyntaxKind.DeleteKeyword]: "delete",
    };

    return mapping[op] || "+";
  }

  private resolveType(typeNode: ts.TypeNode | undefined): string {
    if (!typeNode) return "auto";

    // If we have a type checker, use it directly for type node resolution
    if (this.context.typeChecker) {
      const resolvedType = this.context.typeChecker.resolveTypeNode(typeNode);
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
        return "js::null_t";
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

        // Map common union patterns to typed wrappers
        if (types.length === 2) {
          // Check for string | number pattern
          const hasString = types.some((t) => t === "js::string" || t === "string");
          const hasNumber = types.some((t) => t === "js::number" || t === "number");

          if (hasString && hasNumber) {
            return "js::typed::StringOrNumber";
          }

          // Check for T | null or T | undefined patterns
          const hasNull = types.some((t) =>
            t === "js::null_t" || t === "null" || t === "std::nullptr_t"
          );
          const hasUndefined = types.some((t) => t === "js::undefined_t" || t === "undefined");

          if (hasNull || hasUndefined) {
            const nonNullType = types.find((t) =>
              t !== "js::null_t" && t !== "null" && t !== "std::nullptr_t" &&
              t !== "js::undefined_t" && t !== "undefined"
            );
            if (nonNullType) {
              return `js::typed::Nullable<${nonNullType}>`;
            }
          }
        }

        // Fallback to js::any for complex unions
        return "js::any";
      }

      case ts.SyntaxKind.IntersectionType: {
        const intersectionType = node as ts.IntersectionTypeNode;
        const types = intersectionType.types.map((t) => this.resolveTypeNode(t));
        return types.join(" & ");
      }

      case ts.SyntaxKind.LiteralType: {
        const literalType = node as ts.LiteralTypeNode;
        if (literalType.literal.kind === ts.SyntaxKind.NullKeyword) {
          return "std::nullptr_t";
        }
        // Handle other literal types
        return "js::any";
      }

      case ts.SyntaxKind.ParenthesizedType: {
        const parenType = node as ts.ParenthesizedTypeNode;
        return this.resolveTypeNode(parenType.type);
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

  private getLocation(node: ts.Node): any {
    const sourceFile = node.getSourceFile();
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return {
      start: { line: start.line + 1, column: start.character },
      end: { line: end.line + 1, column: end.character },
    };
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

  /**
   * Collect decorator metadata from a class
   */
  private collectDecoratorMetadata(node: ts.ClassDeclaration): IRDecoratorMetadata | undefined {
    const metadata: IRDecoratorMetadata = {};
    let hasDecorators = false;

    // Collect class decorators
    if (ts.canHaveDecorators(node)) {
      const decorators = ts.getDecorators(node);
      if (decorators && decorators.length > 0) {
        metadata.classDecorators = decorators.map((d) => this.transformDecorator(d, "class"));
        hasDecorators = true;
      }
    }

    // Collect member decorators
    metadata.memberDecorators = new Map();
    metadata.parameterDecorators = new Map();
    metadata.staticDecorators = new Map();

    for (const member of node.members) {
      const memberName = this.getMemberName(member);
      if (!memberName) continue;

      // Check for member decorators
      if (ts.canHaveDecorators(member)) {
        const decorators = ts.getDecorators(member);
        if (decorators && decorators.length > 0) {
          const isStatic = member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword);
          const targetType = this.getDecoratorTargetType(member);
          const irDecorators = decorators.map((d) =>
            this.transformDecorator(d, targetType, memberName)
          );

          if (isStatic) {
            metadata.staticDecorators!.set(memberName, irDecorators);
          } else {
            metadata.memberDecorators!.set(memberName, irDecorators);
          }
          hasDecorators = true;
        }
      }

      // Check for parameter decorators
      if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
        const params = member.parameters;
        params.forEach((param, index) => {
          if (ts.canHaveDecorators(param)) {
            const decorators = ts.getDecorators(param);
            if (decorators && decorators.length > 0) {
              const methodName = ts.isConstructorDeclaration(member) ? "constructor" : memberName;
              if (!metadata.parameterDecorators!.has(methodName)) {
                metadata.parameterDecorators!.set(methodName, new Map());
              }
              const irDecorators = decorators.map((d) =>
                this.transformDecorator(d, "parameter", methodName, index)
              );
              metadata.parameterDecorators!.get(methodName)!.set(index, irDecorators);
              hasDecorators = true;
            }
          }
        });
      }
    }

    return hasDecorators ? metadata : undefined;
  }

  /**
   * Transform a single decorator
   */
  private transformDecorator(
    decorator: ts.Decorator,
    targetType: "class" | "method" | "property" | "parameter" | "accessor",
    targetName?: string,
    parameterIndex?: number,
  ): IRDecorator {
    return {
      kind: IRNodeKind.Decorator,
      expression: this.transformExpression(decorator.expression),
      targetType,
      targetName,
      parameterIndex,
    };
  }

  /**
   * Get the decorator target type from a class member
   */
  private getDecoratorTargetType(member: ts.ClassElement): "method" | "property" | "accessor" {
    if (ts.isMethodDeclaration(member)) {
      return "method";
    } else if (ts.isPropertyDeclaration(member)) {
      return "property";
    } else if (ts.isGetAccessor(member) || ts.isSetAccessor(member)) {
      return "accessor";
    }
    return "property";
  }

  /**
   * Get member name from class element
   */
  private getMemberName(member: ts.ClassElement): string | undefined {
    if (
      ts.isMethodDeclaration(member) || ts.isPropertyDeclaration(member) ||
      ts.isGetAccessor(member) || ts.isSetAccessor(member)
    ) {
      if (member.name) {
        if (ts.isIdentifier(member.name)) {
          return member.name.text;
        } else if (ts.isStringLiteral(member.name)) {
          return member.name.text;
        }
      }
    }
    return undefined;
  }
}
