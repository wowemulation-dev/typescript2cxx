/**
 * Modular AST to IR transformer - refactored from monolithic transformer
 */

import { ts } from "../ast/parser.ts";
import { MemoryAnnotation, MemoryAnnotationParser } from "../memory/annotations.ts";
import type { SimpleTypeChecker } from "../type-checker/simple-checker.ts";
import type { CompilerContext } from "../types.ts";
import type { Plugin } from "../plugins/types.ts";
import type { ErrorReporter } from "../errors.ts";
import {
  AccessModifier,
  IRNodeKind,
  MemoryManagement,
  VariableKind,
} from "../ir/nodes.ts";
import type {
  IRImportDeclaration,
  IRImportSpecifier,
  IRExportDeclaration,
  IRExportSpecifier,
  IRExportNamedDeclaration,
  IRExportDefaultDeclaration,
  IRModule,
  IRProgram,
  IRStatement,
} from "../ir/nodes.ts";

// Import modular transformers
import { StatementTransformer } from "./transformers/statement-transformer.ts";
import { ExpressionTransformer } from "./transformers/expression-transformer.ts";
import { DeclarationTransformer } from "./transformers/declaration-transformer.ts";
import type { TransformContext } from "./context.ts";

/**
 * Transform options
 */
export interface TransformOptions {
  /** Current file being transformed */
  filename?: string;

  /** Source code being transformed */
  source?: string;

  /** Compiler context */
  context: CompilerContext;

  /** Active plugins */
  plugins: Plugin[];

  /** Error reporter */
  errorReporter: ErrorReporter;

  /** Type checker */
  typeChecker: SimpleTypeChecker;
}

/**
 * Modular AST transformer using specialized transformer classes
 */
class ModularASTTransformer {
  private readonly expressionTransformer: ExpressionTransformer;
  private readonly declarationTransformer: DeclarationTransformer;
  private readonly statementTransformer: StatementTransformer;
  private readonly memoryParser: MemoryAnnotationParser;

  constructor(private options: TransformOptions) {
    this.memoryParser = new MemoryAnnotationParser();
    this.expressionTransformer = new ExpressionTransformer();
    this.declarationTransformer = new DeclarationTransformer(this.expressionTransformer);
    this.statementTransformer = new StatementTransformer(this.expressionTransformer, this.declarationTransformer);
    
    // Wire up circular dependencies
    this.declarationTransformer.setStatementTransformer(this.statementTransformer);
  }

  transform(ast: ts.SourceFile): IRProgram {
    const context: TransformContext = {
      filename: this.options.filename,
      source: this.options.source,
      compilerContext: this.options.context,
      plugins: this.options.plugins,
      errorReporter: this.options.errorReporter,
      typeChecker: this.options.typeChecker,
      scopeDepth: 0,
      scopeVariables: new Set(),
    };

    const statements: IRStatement[] = [];

    for (const node of ast.statements) {
      const stmt = this.transformModuleItem(node, context);
      if (stmt) {
        statements.push(stmt);
      }
    }

    const module: IRModule = {
      kind: IRNodeKind.Module,
      name: this.getModuleName(ast.fileName),
      body: statements,
      location: { line: 1, column: 1 },
    };

    return {
      kind: IRNodeKind.Program,
      modules: [module],
      location: { line: 1, column: 1 },
    };
  }

  private transformModuleItem(node: ts.Statement, context: TransformContext): IRStatement | null {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        return this.transformImportDeclaration(node as ts.ImportDeclaration, context);
      case ts.SyntaxKind.ExportDeclaration:
        return this.transformExportDeclaration(node as ts.ExportDeclaration, context);
      case ts.SyntaxKind.ExportAssignment:
        return this.transformExportAssignment(node as ts.ExportAssignment, context);
      default:
        return this.statementTransformer.transformStatement(node, context);
    }
  }

  private transformImportDeclaration(node: ts.ImportDeclaration, context: TransformContext): IRImportDeclaration | null {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return null;
    }

    const source = node.moduleSpecifier.text;
    const specifiers: IRImportSpecifier[] = [];

    if (node.importClause) {
      const importClause = node.importClause;

      // Default import: import Foo from "module"
      if (importClause.name) {
        specifiers.push({
          kind: IRNodeKind.ImportDefaultSpecifier,
          local: importClause.name.text,
          location: this.getLocation(importClause.name, context),
        });
      }

      // Named imports: import { a, b } from "module"
      if (importClause.namedBindings) {
        if (ts.isNamedImports(importClause.namedBindings)) {
          for (const element of importClause.namedBindings.elements) {
            specifiers.push({
              kind: IRNodeKind.NamedImportSpecifier,
              imported: element.propertyName?.text || element.name.text,
              local: element.name.text,
              location: this.getLocation(element, context),
            });
          }
        } else if (ts.isNamespaceImport(importClause.namedBindings)) {
          // Namespace import: import * as ns from "module"
          specifiers.push({
            kind: IRNodeKind.ImportNamespaceSpecifier,
            local: importClause.namedBindings.name.text,
            location: this.getLocation(importClause.namedBindings, context),
          });
        }
      }
    }

    return {
      kind: IRNodeKind.ImportDeclaration,
      source,
      specifiers,
      location: this.getLocation(node, context),
    };
  }

  private transformExportDeclaration(
    node: ts.ExportDeclaration,
    context: TransformContext,
  ): IRExportNamedDeclaration | null {
    const specifiers: IRExportSpecifier[] = [];

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        specifiers.push({
          kind: IRNodeKind.ExportSpecifier,
          local: element.propertyName?.text || element.name.text,
          exported: element.name.text,
          location: this.getLocation(element, context),
        });
      }
    }

    const source = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
      ? node.moduleSpecifier.text
      : null;

    return {
      kind: IRNodeKind.ExportNamedDeclaration,
      specifiers,
      source,
      declaration: null, // For re-exports
      location: this.getLocation(node, context),
    };
  }

  private transformExportAssignment(node: ts.ExportAssignment, context: TransformContext): IRExportDefaultDeclaration | null {
    if (node.isExportEquals) {
      // export = expression (CommonJS style)
      context.errorReporter.reportWarning({
        message: "export = syntax is not supported, use export default instead",
        location: this.getLocation(node, context),
      });
      return null;
    }

    return {
      kind: IRNodeKind.ExportDefaultDeclaration,
      declaration: this.expressionTransformer.transformExpression(node.expression, context),
      location: this.getLocation(node, context),
    };
  }

  private getModuleName(filename?: string): string {
    if (!filename) {
      return "main";
    }

    const parts = filename.split("/");
    const basename = parts[parts.length - 1];
    return basename.replace(/\.[^.]*$/, ""); // Remove extension
  }

  private getLocation(node: ts.Node, context: TransformContext) {
    if (!node.getSourceFile || !context.source) {
      return { line: 0, column: 0 };
    }

    const sourceFile = node.getSourceFile();
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    
    return {
      line: start.line + 1,
      column: start.character + 1,
    };
  }
}

/**
 * Transform TypeScript AST to IR
 */
export function transform(ast: ts.SourceFile, options: TransformOptions): IRProgram {
  const transformer = new ModularASTTransformer(options);
  return transformer.transform(ast);
}