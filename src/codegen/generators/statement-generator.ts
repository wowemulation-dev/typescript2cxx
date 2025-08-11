/**
 * Statement generation utilities for C++ code generation
 */

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
} from "../../ir/nodes.ts";
import { IRNodeKind } from "../../ir/nodes.ts";
import type { CodeGenContext } from "../context.ts";
import type { ExpressionGenerator } from "./expression-generator.ts";
import type { DeclarationGenerator } from "./declaration-generator.ts";

export class StatementGenerator {
  constructor(
    private expressionGen: ExpressionGenerator,
    private declarationGen: DeclarationGenerator,
  ) {}

  generateStatement(stmt: IRStatement, context: CodeGenContext): string {
    switch (stmt.kind) {
      case IRNodeKind.VariableDeclaration:
        return this.declarationGen.generateVariable(stmt, context);
      case IRNodeKind.FunctionDeclaration:
        return this.declarationGen.generateFunction(stmt, context);
      case IRNodeKind.ClassDeclaration:
        return this.declarationGen.generateClass(stmt, context);
      case IRNodeKind.InterfaceDeclaration:
        return this.declarationGen.generateInterface(stmt, context);
      case IRNodeKind.EnumDeclaration:
        return this.declarationGen.generateEnum(stmt, context);
      case IRNodeKind.BlockStatement:
        return this.generateBlock(stmt, context);
      case IRNodeKind.ExpressionStatement:
        return this.generateExpressionStatement(stmt, context);
      case IRNodeKind.IfStatement:
        return this.generateIf(stmt, context);
      case IRNodeKind.SwitchStatement:
        return this.generateSwitch(stmt, context);
      case IRNodeKind.WhileStatement:
        return this.generateWhile(stmt, context);
      case IRNodeKind.ForStatement:
        return this.generateFor(stmt, context);
      case IRNodeKind.ForOfStatement:
        return this.generateForOf(stmt, context);
      case IRNodeKind.ForInStatement:
        return this.generateForIn(stmt, context);
      case IRNodeKind.ReturnStatement:
        return this.generateReturn(stmt, context);
      case IRNodeKind.BreakStatement:
        return this.generateBreak(stmt, context);
      case IRNodeKind.ContinueStatement:
        return this.generateContinue(stmt, context);
      case IRNodeKind.TryStatement:
        return this.generateTry(stmt, context);
      case IRNodeKind.ThrowStatement:
        return this.generateThrow(stmt, context);
      case IRNodeKind.NamespaceDeclaration:
        return this.declarationGen.generateNamespace(stmt, context);
      case IRNodeKind.ImportDeclaration:
      case IRNodeKind.ExportDeclaration:
      case IRNodeKind.ExportNamedDeclaration:
      case IRNodeKind.ExportDefaultDeclaration:
      case IRNodeKind.ExportAllDeclaration:
        // These are handled at module level
        return "";
      default:
        context.errorReporter?.reportWarning({
          message: `Unsupported statement kind: ${stmt.kind}`,
          location: stmt.location,
        });
        return "";
    }
  }

  generateBlock(block: IRBlockStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    lines.push(`${indent}{`);

    const innerContext = { ...context, indentLevel: context.indentLevel + 1 };
    for (const stmt of block.body) {
      const code = this.generateStatement(stmt, innerContext);
      if (code) {
        lines.push(code);
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateIf(ifStmt: IRIfStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    const condition = this.expressionGen.generateExpression(ifStmt.test, context);
    lines.push(`${indent}if (${condition}) {`);

    // Generate consequent
    const consequentContext = { ...context, indentLevel: context.indentLevel + 1 };
    if (ifStmt.consequent.kind === IRNodeKind.BlockStatement) {
      for (const stmt of ifStmt.consequent.body) {
        const code = this.generateStatement(stmt, consequentContext);
        if (code) {
          lines.push(code);
        }
      }
    } else {
      const code = this.generateStatement(ifStmt.consequent, consequentContext);
      if (code) {
        lines.push(code);
      }
    }

    lines.push(`${indent}}`);

    // Generate alternate (else)
    if (ifStmt.alternate) {
      if (ifStmt.alternate.kind === IRNodeKind.IfStatement) {
        lines.push(`${indent}else ${this.generateIf(ifStmt.alternate, { ...context, indentLevel: context.indentLevel - 1 }).trimStart()}`);
      } else {
        lines.push(`${indent}else {`);
        const alternateContext = { ...context, indentLevel: context.indentLevel + 1 };
        if (ifStmt.alternate.kind === IRNodeKind.BlockStatement) {
          for (const stmt of ifStmt.alternate.body) {
            const code = this.generateStatement(stmt, alternateContext);
            if (code) {
              lines.push(code);
            }
          }
        } else {
          const code = this.generateStatement(ifStmt.alternate, alternateContext);
          if (code) {
            lines.push(code);
          }
        }
        lines.push(`${indent}}`);
      }
    }

    return lines.join("\n");
  }

  generateSwitch(switchStmt: IRSwitchStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    const discriminant = this.expressionGen.generateExpression(switchStmt.discriminant, context);
    lines.push(`${indent}switch (${discriminant}) {`);

    const caseContext = { ...context, indentLevel: context.indentLevel + 1 };
    for (const caseClause of switchStmt.cases) {
      const caseIndent = this.getIndent(caseContext);
      if (caseClause.test) {
        const test = this.expressionGen.generateExpression(caseClause.test, context);
        lines.push(`${caseIndent}case ${test}:`);
      } else {
        lines.push(`${caseIndent}default:`);
      }

      if (caseClause.consequent.length > 0) {
        const bodyContext = { ...context, indentLevel: context.indentLevel + 2 };
        for (const stmt of caseClause.consequent) {
          const code = this.generateStatement(stmt, bodyContext);
          if (code) {
            lines.push(code);
          }
        }
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateWhile(whileStmt: IRWhileStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    const condition = this.expressionGen.generateExpression(whileStmt.test, context);
    lines.push(`${indent}while (${condition}) {`);

    const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
    if (whileStmt.body.kind === IRNodeKind.BlockStatement) {
      for (const stmt of whileStmt.body.body) {
        const code = this.generateStatement(stmt, bodyContext);
        if (code) {
          lines.push(code);
        }
      }
    } else {
      const code = this.generateStatement(whileStmt.body, bodyContext);
      if (code) {
        lines.push(code);
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateFor(forStmt: IRForStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    let init = "";
    if (forStmt.init) {
      if (forStmt.init.kind === IRNodeKind.VariableDeclaration) {
        const varContext = { ...context, noSemicolon: true };
        init = this.declarationGen.generateVariable(forStmt.init, varContext).trim();
      } else {
        init = this.expressionGen.generateExpression(forStmt.init, context);
      }
    }

    const test = forStmt.test ? this.expressionGen.generateExpression(forStmt.test, context) : "";
    const update = forStmt.update ? this.expressionGen.generateExpression(forStmt.update, context) : "";

    lines.push(`${indent}for (${init}; ${test}; ${update}) {`);

    const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
    if (forStmt.body.kind === IRNodeKind.BlockStatement) {
      for (const stmt of forStmt.body.body) {
        const code = this.generateStatement(stmt, bodyContext);
        if (code) {
          lines.push(code);
        }
      }
    } else {
      const code = this.generateStatement(forStmt.body, bodyContext);
      if (code) {
        lines.push(code);
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateForOf(forOfStmt: IRForOfStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    let iterVar = "";
    let iterType = "auto";

    if (forOfStmt.left.kind === IRNodeKind.VariableDeclaration) {
      const varDecl = forOfStmt.left;
      if (varDecl.declarations && varDecl.declarations.length > 0) {
        const decl = varDecl.declarations[0];
        iterVar = decl.id.name;
        if (decl.type) {
          iterType = context.typeMapper.mapType(decl.type);
        }
      }
    } else if (forOfStmt.left.kind === IRNodeKind.Identifier) {
      iterVar = forOfStmt.left.name;
    }

    const collection = this.expressionGen.generateExpression(forOfStmt.right, context);
    lines.push(`${indent}for (${iterType}& ${iterVar} : ${collection}) {`);

    const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
    if (forOfStmt.body.kind === IRNodeKind.BlockStatement) {
      for (const stmt of forOfStmt.body.body) {
        const code = this.generateStatement(stmt, bodyContext);
        if (code) {
          lines.push(code);
        }
      }
    } else {
      const code = this.generateStatement(forOfStmt.body, bodyContext);
      if (code) {
        lines.push(code);
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateForIn(forInStmt: IRForInStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    let iterVar = "";
    if (forInStmt.left.kind === IRNodeKind.VariableDeclaration) {
      const varDecl = forInStmt.left;
      if (varDecl.declarations && varDecl.declarations.length > 0) {
        iterVar = varDecl.declarations[0].id.name;
      }
    } else if (forInStmt.left.kind === IRNodeKind.Identifier) {
      iterVar = forInStmt.left.name;
    }

    const obj = this.expressionGen.generateExpression(forInStmt.right, context);
    lines.push(`${indent}for (const auto& ${iterVar} : js::object_keys(${obj})) {`);

    const bodyContext = { ...context, indentLevel: context.indentLevel + 1 };
    if (forInStmt.body.kind === IRNodeKind.BlockStatement) {
      for (const stmt of forInStmt.body.body) {
        const code = this.generateStatement(stmt, bodyContext);
        if (code) {
          lines.push(code);
        }
      }
    } else {
      const code = this.generateStatement(forInStmt.body, bodyContext);
      if (code) {
        lines.push(code);
      }
    }

    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateReturn(returnStmt: IRReturnStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    if (returnStmt.argument) {
      const value = this.expressionGen.generateExpression(returnStmt.argument, context);
      return `${indent}return ${value};`;
    }
    return `${indent}return;`;
  }

  generateBreak(breakStmt: IRBreakStatement, _context: CodeGenContext): string {
    const indent = this.getIndent(_context);
    if (breakStmt.label) {
      // C++ doesn't support labeled break directly
      return `${indent}break; // Label: ${breakStmt.label}`;
    }
    return `${indent}break;`;
  }

  generateContinue(continueStmt: IRContinueStatement, _context: CodeGenContext): string {
    const indent = this.getIndent(_context);
    if (continueStmt.label) {
      // C++ doesn't support labeled continue directly
      return `${indent}continue; // Label: ${continueStmt.label}`;
    }
    return `${indent}continue;`;
  }

  generateTry(tryStmt: IRTryStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const lines: string[] = [];

    lines.push(`${indent}try {`);
    const tryContext = { ...context, indentLevel: context.indentLevel + 1 };
    for (const stmt of tryStmt.block.body) {
      const code = this.generateStatement(stmt, tryContext);
      if (code) {
        lines.push(code);
      }
    }
    lines.push(`${indent}}`);

    if (tryStmt.handler) {
      lines.push(this.generateCatch(tryStmt.handler, context));
    }

    return lines.join("\n");
  }

  generateCatch(catchClause: IRCatchClause, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const paramName = catchClause.param?.name || "e";
    const lines: string[] = [`${indent}catch (const js::any& ${paramName}) {`];

    const catchContext = { ...context, indentLevel: context.indentLevel + 1 };
    for (const stmt of catchClause.body.body) {
      const code = this.generateStatement(stmt, catchContext);
      if (code) {
        lines.push(code);
      }
    }
    lines.push(`${indent}}`);

    return lines.join("\n");
  }

  generateThrow(throwStmt: IRThrowStatement, context: CodeGenContext): string {
    const indent = this.getIndent(context);
    const expr = this.expressionGen.generateExpression(throwStmt.argument, context);
    return `${indent}throw ${expr};`;
  }

  generateExpressionStatement(
    exprStmt: IRExpressionStatement,
    context: CodeGenContext,
  ): string {
    const indent = this.getIndent(context);
    const expr = this.expressionGen.generateExpression(exprStmt.expression, context);

    // Don't add semicolon for lambda expressions
    if (exprStmt.expression.kind === IRNodeKind.FunctionExpression ||
        exprStmt.expression.kind === IRNodeKind.ArrowFunctionExpression) {
      return `${indent}${expr}`;
    }

    return `${indent}${expr};`;
  }

  private getIndent(context: CodeGenContext): string {
    return "  ".repeat(context.indentLevel);
  }
}