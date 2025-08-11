/**
 * Statement transformation utilities for AST to IR transformation
 */

import { ts } from "../../ast/parser.ts";
import { AccessModifier, IRNodeKind, MemoryManagement, VariableKind } from "../../ir/nodes.ts";
import type {
  IRBlockStatement,
  IRBreakStatement,
  IRContinueStatement,
  IRExpressionStatement,
  IRForInStatement,
  IRForOfStatement,
  IRForStatement,
  IRIfStatement,
  IRReturnStatement,
  IRStatement,
  IRSwitchStatement,
  IRThrowStatement,
  IRTryStatement,
  IRWhileStatement,
  IRCatchClause,
  IRSwitchCase,
  IRVariableDeclaration,
  IRPattern,
  IRExpression,
} from "../../ir/nodes.ts";
import type { TransformContext } from "../context.ts";
import type { ExpressionTransformer } from "./expression-transformer.ts";
import type { DeclarationTransformer } from "./declaration-transformer.ts";

export class StatementTransformer {
  constructor(
    private expressionTransformer: ExpressionTransformer,
    private declarationTransformer: DeclarationTransformer,
  ) {}

  transformStatement(node: ts.Statement, context: TransformContext): IRStatement {
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        return this.transformBlockStatement(node as ts.Block, context);
      case ts.SyntaxKind.ExpressionStatement:
        return this.transformExpressionStatement(node as ts.ExpressionStatement, context);
      case ts.SyntaxKind.IfStatement:
        return this.transformIfStatement(node as ts.IfStatement, context);
      case ts.SyntaxKind.SwitchStatement:
        return this.transformSwitchStatement(node as ts.SwitchStatement, context);
      case ts.SyntaxKind.WhileStatement:
        return this.transformWhileStatement(node as ts.WhileStatement, context);
      case ts.SyntaxKind.ForStatement:
        return this.transformForStatement(node as ts.ForStatement, context);
      case ts.SyntaxKind.ForOfStatement:
        return this.transformForOfStatement(node as ts.ForOfStatement, context);
      case ts.SyntaxKind.ForInStatement:
        return this.transformForInStatement(node as ts.ForInStatement, context);
      case ts.SyntaxKind.ReturnStatement:
        return this.transformReturnStatement(node as ts.ReturnStatement, context);
      case ts.SyntaxKind.BreakStatement:
        return this.transformBreakStatement(node as ts.BreakStatement, context);
      case ts.SyntaxKind.ContinueStatement:
        return this.transformContinueStatement(node as ts.ContinueStatement, context);
      case ts.SyntaxKind.TryStatement:
        return this.transformTryStatement(node as ts.TryStatement, context);
      case ts.SyntaxKind.ThrowStatement:
        return this.transformThrowStatement(node as ts.ThrowStatement, context);
      case ts.SyntaxKind.VariableStatement:
        return this.declarationTransformer.transformVariableStatement(node as ts.VariableStatement, context);
      case ts.SyntaxKind.FunctionDeclaration:
        return this.declarationTransformer.transformFunctionDeclaration(node as ts.FunctionDeclaration, context);
      case ts.SyntaxKind.ClassDeclaration:
        return this.declarationTransformer.transformClassDeclaration(node as ts.ClassDeclaration, context);
      case ts.SyntaxKind.InterfaceDeclaration:
        return this.declarationTransformer.transformInterfaceDeclaration(node as ts.InterfaceDeclaration, context);
      case ts.SyntaxKind.EnumDeclaration:
        return this.declarationTransformer.transformEnumDeclaration(node as ts.EnumDeclaration, context);
      case ts.SyntaxKind.ModuleDeclaration:
        return this.declarationTransformer.transformNamespaceDeclaration(node as ts.ModuleDeclaration, context);
      case ts.SyntaxKind.TypeAliasDeclaration:
        // Type aliases are compile-time only
        return {
          kind: IRNodeKind.ExpressionStatement,
          expression: {
            kind: IRNodeKind.Literal,
            value: "/* type alias */",
            raw: "/* type alias */",
            literalType: "string",
            location: this.getLocation(node, context),
          },
          location: this.getLocation(node, context),
        } as IRExpressionStatement;
      case ts.SyntaxKind.ImportDeclaration:
      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.ExportAssignment:
        // Module-level statements handled elsewhere
        return {
          kind: IRNodeKind.ExpressionStatement,
          expression: {
            kind: IRNodeKind.Literal,
            value: "/* import/export */",
            raw: "/* import/export */",
            literalType: "string",
            location: this.getLocation(node, context),
          },
          location: this.getLocation(node, context),
        } as IRExpressionStatement;
      default:
        context.errorReporter.reportWarning({
          message: `Unsupported statement kind: ${ts.SyntaxKind[node.kind]}`,
          location: this.getLocation(node, context),
        });
        return {
          kind: IRNodeKind.ExpressionStatement,
          expression: {
            kind: IRNodeKind.Literal,
            value: `/* unsupported: ${ts.SyntaxKind[node.kind]} */`,
            raw: `/* unsupported: ${ts.SyntaxKind[node.kind]} */`,
            literalType: "string",
            location: this.getLocation(node, context),
          },
          location: this.getLocation(node, context),
        } as IRExpressionStatement;
    }
  }

  private transformBlockStatement(node: ts.Block, context: TransformContext): IRBlockStatement {
    return {
      kind: IRNodeKind.BlockStatement,
      body: node.statements.map(stmt => this.transformStatement(stmt, context)),
      location: this.getLocation(node, context),
    };
  }

  private transformExpressionStatement(node: ts.ExpressionStatement, context: TransformContext): IRExpressionStatement {
    return {
      kind: IRNodeKind.ExpressionStatement,
      expression: this.expressionTransformer.transformExpression(node.expression, context),
      location: this.getLocation(node, context),
    };
  }

  private transformIfStatement(node: ts.IfStatement, context: TransformContext): IRIfStatement {
    return {
      kind: IRNodeKind.IfStatement,
      test: this.expressionTransformer.transformExpression(node.expression, context),
      consequent: this.transformStatement(node.thenStatement, context),
      alternate: node.elseStatement ? this.transformStatement(node.elseStatement, context) : null,
      location: this.getLocation(node, context),
    };
  }

  private transformSwitchStatement(node: ts.SwitchStatement, context: TransformContext): IRSwitchStatement {
    return {
      kind: IRNodeKind.SwitchStatement,
      discriminant: this.expressionTransformer.transformExpression(node.expression, context),
      cases: node.caseBlock.clauses.map(clause => {
        const switchCase: IRSwitchCase = {
          kind: IRNodeKind.SwitchCase,
          test: ts.isCaseClause(clause) 
            ? this.expressionTransformer.transformExpression(clause.expression, context)
            : null,
          consequent: clause.statements.map(stmt => this.transformStatement(stmt, context)),
          location: this.getLocation(clause, context),
        };
        return switchCase;
      }),
      location: this.getLocation(node, context),
    };
  }

  private transformWhileStatement(node: ts.WhileStatement, context: TransformContext): IRWhileStatement {
    return {
      kind: IRNodeKind.WhileStatement,
      test: this.expressionTransformer.transformExpression(node.expression, context),
      body: this.transformStatement(node.statement, context),
      location: this.getLocation(node, context),
    };
  }

  private transformForStatement(node: ts.ForStatement, context: TransformContext): IRForStatement {
    return {
      kind: IRNodeKind.ForStatement,
      init: node.initializer ? this.transformForInit(node.initializer, context) : null,
      test: node.condition ? this.expressionTransformer.transformExpression(node.condition, context) : null,
      update: node.incrementor ? this.expressionTransformer.transformExpression(node.incrementor, context) : null,
      body: this.transformStatement(node.statement, context),
      location: this.getLocation(node, context),
    };
  }

  private transformForOfStatement(node: ts.ForOfStatement, context: TransformContext): IRForOfStatement {
    return {
      kind: IRNodeKind.ForOfStatement,
      left: this.transformForOfLeft(node.initializer, context),
      right: this.expressionTransformer.transformExpression(node.expression, context),
      body: this.transformStatement(node.statement, context),
      location: this.getLocation(node, context),
    };
  }

  private transformForInStatement(node: ts.ForInStatement, context: TransformContext): IRForInStatement {
    return {
      kind: IRNodeKind.ForInStatement,
      left: this.transformForInLeft(node.initializer, context),
      right: this.expressionTransformer.transformExpression(node.expression, context),
      body: this.transformStatement(node.statement, context),
      location: this.getLocation(node, context),
    };
  }

  private transformForInit(node: ts.ForInitializer, context: TransformContext): IRVariableDeclaration | IRExpression {
    if (ts.isVariableDeclarationList(node)) {
      return this.declarationTransformer.transformVariableDeclarationList(node, context);
    } else {
      return this.expressionTransformer.transformExpression(node, context);
    }
  }

  private transformForOfLeft(node: ts.ForInitializer, context: TransformContext): IRVariableDeclaration | IRPattern {
    if (ts.isVariableDeclarationList(node)) {
      return this.declarationTransformer.transformVariableDeclarationList(node, context);
    } else if (ts.isIdentifier(node)) {
      return {
        kind: IRNodeKind.Identifier,
        name: node.text,
        location: this.getLocation(node, context),
      };
    } else {
      // Handle other patterns
      context.errorReporter.reportWarning({
        message: "Unsupported for-of left-hand side pattern",
        location: this.getLocation(node, context),
      });
      return {
        kind: IRNodeKind.Identifier,
        name: "_temp",
        location: this.getLocation(node, context),
      };
    }
  }

  private transformForInLeft(node: ts.ForInitializer, context: TransformContext): IRVariableDeclaration | IRPattern {
    return this.transformForOfLeft(node, context);
  }

  private transformReturnStatement(node: ts.ReturnStatement, context: TransformContext): IRReturnStatement {
    return {
      kind: IRNodeKind.ReturnStatement,
      argument: node.expression ? this.expressionTransformer.transformExpression(node.expression, context) : null,
      location: this.getLocation(node, context),
    };
  }

  private transformBreakStatement(node: ts.BreakStatement, context: TransformContext): IRBreakStatement {
    return {
      kind: IRNodeKind.BreakStatement,
      label: node.label?.text || null,
      location: this.getLocation(node, context),
    };
  }

  private transformContinueStatement(node: ts.ContinueStatement, context: TransformContext): IRContinueStatement {
    return {
      kind: IRNodeKind.ContinueStatement,
      label: node.label?.text || null,
      location: this.getLocation(node, context),
    };
  }

  private transformTryStatement(node: ts.TryStatement, context: TransformContext): IRTryStatement {
    return {
      kind: IRNodeKind.TryStatement,
      block: this.transformBlockStatement(node.tryBlock, context),
      handler: node.catchClause ? this.transformCatchClause(node.catchClause, context) : null,
      finalizer: node.finallyBlock ? this.transformBlockStatement(node.finallyBlock, context) : null,
      location: this.getLocation(node, context),
    };
  }

  private transformCatchClause(node: ts.CatchClause, context: TransformContext): IRCatchClause {
    return {
      kind: IRNodeKind.CatchClause,
      param: node.variableDeclaration?.name && ts.isIdentifier(node.variableDeclaration.name) ? {
        kind: IRNodeKind.Identifier,
        name: node.variableDeclaration.name.text,
        location: this.getLocation(node.variableDeclaration.name, context),
      } : null,
      body: this.transformBlockStatement(node.block, context),
      location: this.getLocation(node, context),
    };
  }

  private transformThrowStatement(node: ts.ThrowStatement, context: TransformContext): IRThrowStatement {
    return {
      kind: IRNodeKind.ThrowStatement,
      argument: this.expressionTransformer.transformExpression(node.expression, context),
      location: this.getLocation(node, context),
    };
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