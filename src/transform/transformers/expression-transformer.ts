/**
 * Expression transformation utilities for AST to IR transformation
 */

import { ts } from "../../ast/parser.ts";
import { IRNodeKind } from "../../ir/nodes.ts";
import type {
  IRArrayExpression,
  IRAssignmentExpression,
  IRAwaitExpression,
  IRBinaryExpression,
  IRCallExpression,
  IRConditionalExpression,
  IRExpression,
  IRFunctionExpression,
  IRIdentifier,
  IRLiteral,
  IRMemberExpression,
  IRNewExpression,
  IRObjectExpression,
  IRObjectProperty,
  IROptionalChainingExpression,
  IRSpreadElement,
  IRTemplateLiteral,
  IRTemplateElement,
  IRThisExpression,
  IRUnaryExpression,
  IRUpdateExpression,
  IRLogicalExpression,
  IRSequenceExpression,
  IRYieldExpression,
  IRTaggedTemplateExpression,
} from "../../ir/nodes.ts";
import type { TransformContext } from "../context.ts";

export class ExpressionTransformer {
  transformExpression(node: ts.Expression, context: TransformContext): IRExpression {
    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        return this.transformIdentifier(node as ts.Identifier, context);
      case ts.SyntaxKind.NumericLiteral:
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.UndefinedKeyword:
      case ts.SyntaxKind.BigIntLiteral:
      case ts.SyntaxKind.RegularExpressionLiteral:
        return this.transformLiteral(node, context);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.transformArrayExpression(node as ts.ArrayLiteralExpression, context);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.transformObjectExpression(node as ts.ObjectLiteralExpression, context);
      case ts.SyntaxKind.CallExpression:
        return this.transformCallExpression(node as ts.CallExpression, context);
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.transformMemberExpression(node as ts.PropertyAccessExpression, context);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.transformMemberExpression(node as ts.ElementAccessExpression, context);
      case ts.SyntaxKind.BinaryExpression:
        return this.transformBinaryExpression(node as ts.BinaryExpression, context);
      case ts.SyntaxKind.UnaryExpression:
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.transformUnaryExpression(node as ts.PrefixUnaryExpression, context);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.transformUpdateExpression(node as ts.PostfixUnaryExpression, context);
      case ts.SyntaxKind.ConditionalExpression:
        return this.transformConditionalExpression(node as ts.ConditionalExpression, context);
      case ts.SyntaxKind.NewExpression:
        return this.transformNewExpression(node as ts.NewExpression, context);
      case ts.SyntaxKind.ThisKeyword:
        return this.transformThisExpression(node as ts.ThisExpression, context);
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.ArrowFunction:
        return this.transformFunctionExpression(node as ts.FunctionExpression | ts.ArrowFunction, context);
      case ts.SyntaxKind.TemplateExpression:
        return this.transformTemplateLiteral(node as ts.TemplateExpression, context);
      case ts.SyntaxKind.TaggedTemplateExpression:
        return this.transformTaggedTemplateExpression(node as ts.TaggedTemplateExpression, context);
      case ts.SyntaxKind.AwaitExpression:
        return this.transformAwaitExpression(node as ts.AwaitExpression, context);
      case ts.SyntaxKind.YieldExpression:
        return this.transformYieldExpression(node as ts.YieldExpression, context);
      case ts.SyntaxKind.SpreadElement:
        return this.transformSpreadElement(node as ts.SpreadElement, context);
      case ts.SyntaxKind.TypeOfExpression:
        return this.transformTypeOfExpression(node as ts.TypeOfExpression, context);
      case ts.SyntaxKind.DeleteExpression:
        return this.transformDeleteExpression(node as ts.DeleteExpression, context);
      case ts.SyntaxKind.AsExpression:
        return this.transformAsExpression(node as ts.AsExpression, context);
      case ts.SyntaxKind.SatisfiesExpression:
        return this.transformSatisfiesExpression(node as ts.SatisfiesExpression, context);
      case ts.SyntaxKind.NonNullExpression:
        return this.transformNonNullExpression(node as ts.NonNullExpression, context);
      case ts.SyntaxKind.ParenthesizedExpression:
        return this.transformExpression((node as ts.ParenthesizedExpression).expression, context);
      default:
        context.errorReporter.reportWarning({
          message: `Unsupported expression kind: ${ts.SyntaxKind[node.kind]}`,
          location: this.getLocation(node, context),
        });
        return {
          kind: IRNodeKind.Literal,
          value: `/* unsupported: ${ts.SyntaxKind[node.kind]} */`,
          raw: `/* unsupported: ${ts.SyntaxKind[node.kind]} */`,
          literalType: "string",
          location: this.getLocation(node, context),
        } as IRLiteral;
    }
  }

  private transformIdentifier(node: ts.Identifier, context: TransformContext): IRIdentifier {
    return {
      kind: IRNodeKind.Identifier,
      name: node.text,
      location: this.getLocation(node, context),
    };
  }

  private transformLiteral(node: ts.Expression, context: TransformContext): IRLiteral {
    let value: string | number | boolean | null = null;
    let raw = node.getText();
    let literalType: "string" | "number" | "boolean" | "null" | "undefined" | "regex" | "bigint" = "string";

    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral:
        const numLiteral = node as ts.NumericLiteral;
        value = parseFloat(numLiteral.text);
        literalType = "number";
        break;
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        const strLiteral = node as ts.StringLiteral;
        value = strLiteral.text;
        literalType = "string";
        break;
      case ts.SyntaxKind.TrueKeyword:
        value = true;
        literalType = "boolean";
        break;
      case ts.SyntaxKind.FalseKeyword:
        value = false;
        literalType = "boolean";
        break;
      case ts.SyntaxKind.NullKeyword:
        value = null;
        literalType = "null";
        break;
      case ts.SyntaxKind.UndefinedKeyword:
        value = null; // Will be handled as undefined in C++
        literalType = "undefined";
        break;
      case ts.SyntaxKind.BigIntLiteral:
        const bigIntLiteral = node as ts.BigIntLiteral;
        const bigintText = bigIntLiteral.text;
        value = bigintText; // Keep as string for now
        literalType = "bigint";
        break;
      case ts.SyntaxKind.RegularExpressionLiteral:
        // Parse regex pattern and flags
        const regexMatch = raw.match(/^\/(.+)\/([gimuy]*)$/);
        if (regexMatch) {
          return {
            kind: IRNodeKind.Literal,
            value: regexMatch[1],
            raw,
            literalType: "regex",
            pattern: regexMatch[1],
            flags: regexMatch[2],
            location: this.getLocation(node, context),
          } as IRLiteral;
        }
        value = raw;
        literalType = "string";
        break;
      default:
        value = raw;
        literalType = "string";
    }

    return {
      kind: IRNodeKind.Literal,
      value,
      raw,
      literalType,
      location: this.getLocation(node, context),
    };
  }

  private transformArrayExpression(node: ts.ArrayLiteralExpression, context: TransformContext): IRArrayExpression {
    const elements = node.elements.map(element => {
      if (ts.isOmittedExpression(element)) {
        return null; // Hole in array
      }
      return this.transformExpression(element, context);
    });

    return {
      kind: IRNodeKind.ArrayExpression,
      elements,
      location: this.getLocation(node, context),
    };
  }

  private transformObjectExpression(node: ts.ObjectLiteralExpression, context: TransformContext): IRObjectExpression {
    const properties = node.properties.map(prop => {
      if (ts.isPropertyAssignment(prop)) {
        // Regular property: { key: value }
        const key = ts.isComputedPropertyName(prop.name) 
          ? this.transformExpression(prop.name.expression, context)
          : ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) || ts.isNumericLiteral(prop.name)
            ? this.transformLiteral(prop.name, context)
            : this.transformExpression(prop.name as ts.Expression, context);

        return {
          kind: IRNodeKind.ObjectProperty,
          key,
          value: this.transformExpression(prop.initializer, context),
          computed: ts.isComputedPropertyName(prop.name),
          method: false,
          shorthand: false,
          location: this.getLocation(prop, context),
        } as IRObjectProperty;
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        // Shorthand property: { key } -> { key: key }
        const keyExpr = this.transformIdentifier(prop.name, context);
        return {
          kind: IRNodeKind.ObjectProperty,
          key: keyExpr,
          value: keyExpr,
          computed: false,
          method: false,
          shorthand: true,
          location: this.getLocation(prop, context),
        } as IRObjectProperty;
      } else if (ts.isMethodDeclaration(prop)) {
        // Method: { method() {} }
        const key = ts.isComputedPropertyName(prop.name)
          ? this.transformExpression(prop.name.expression, context)
          : this.transformLiteral(prop.name as ts.Expression, context);

        const methodFunction: IRFunctionExpression = {
          kind: IRNodeKind.FunctionExpression,
          name: null,
          params: [], // Will be filled by function transformer
          body: { kind: IRNodeKind.BlockStatement, body: [], location: this.getLocation(prop.body || prop, context) },
          isAsync: !!prop.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword),
          isGenerator: !!prop.asteriskToken,
          location: this.getLocation(prop, context),
        };

        return {
          kind: IRNodeKind.ObjectProperty,
          key,
          value: methodFunction,
          computed: ts.isComputedPropertyName(prop.name),
          method: true,
          shorthand: false,
          location: this.getLocation(prop, context),
        } as IRObjectProperty;
      } else if (ts.isSpreadAssignment(prop)) {
        // Spread: { ...obj }
        return {
          kind: IRNodeKind.SpreadElement,
          expression: this.transformExpression(prop.expression, context),
          location: this.getLocation(prop, context),
        } as IRSpreadElement;
      } else {
        // Fallback
        context.errorReporter.reportWarning({
          message: `Unsupported object property kind: ${ts.SyntaxKind[prop.kind]}`,
          location: this.getLocation(prop, context),
        });
        return {
          kind: IRNodeKind.ObjectProperty,
          key: { kind: IRNodeKind.Literal, value: "unknown", raw: "unknown", literalType: "string", location: this.getLocation(prop, context) },
          value: { kind: IRNodeKind.Literal, value: "unknown", raw: "unknown", literalType: "string", location: this.getLocation(prop, context) },
          computed: false,
          method: false,
          shorthand: false,
          location: this.getLocation(prop, context),
        } as IRObjectProperty;
      }
    });

    return {
      kind: IRNodeKind.ObjectExpression,
      properties,
      location: this.getLocation(node, context),
    };
  }

  private transformCallExpression(node: ts.CallExpression, context: TransformContext): IRCallExpression {
    return {
      kind: IRNodeKind.CallExpression,
      callee: this.transformExpression(node.expression, context),
      arguments: node.arguments.map(arg => this.transformExpression(arg, context)),
      location: this.getLocation(node, context),
    };
  }

  private transformMemberExpression(
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    context: TransformContext,
  ): IRMemberExpression {
    const isComputed = ts.isElementAccessExpression(node);
    
    return {
      kind: IRNodeKind.MemberExpression,
      object: this.transformExpression(node.expression, context),
      property: isComputed 
        ? this.transformExpression((node as ts.ElementAccessExpression).argumentExpression, context)
        : this.transformIdentifier((node as ts.PropertyAccessExpression).name, context),
      computed: isComputed,
      location: this.getLocation(node, context),
    };
  }

  private transformBinaryExpression(node: ts.BinaryExpression, context: TransformContext): IRBinaryExpression | IRLogicalExpression | IRAssignmentExpression {
    const operator = ts.tokenToString(node.operatorToken.kind) || "";
    
    // Check for logical operators
    if (operator === "&&" || operator === "||" || operator === "??") {
      return {
        kind: IRNodeKind.LogicalExpression,
        operator,
        left: this.transformExpression(node.left, context),
        right: this.transformExpression(node.right, context),
        location: this.getLocation(node, context),
      } as IRLogicalExpression;
    }

    // Check for assignment operators
    if (operator.endsWith("=") && operator !== "==" && operator !== "!=" && operator !== "<=" && operator !== ">=" && operator !== "===" && operator !== "!==") {
      return {
        kind: IRNodeKind.AssignmentExpression,
        operator,
        left: this.transformExpression(node.left, context),
        right: this.transformExpression(node.right, context),
        location: this.getLocation(node, context),
      } as IRAssignmentExpression;
    }

    // Regular binary expression
    return {
      kind: IRNodeKind.BinaryExpression,
      operator,
      left: this.transformExpression(node.left, context),
      right: this.transformExpression(node.right, context),
      location: this.getLocation(node, context),
    };
  }

  private transformUnaryExpression(node: ts.PrefixUnaryExpression, context: TransformContext): IRUnaryExpression {
    const operator = ts.tokenToString(node.operator) || "";
    
    return {
      kind: IRNodeKind.UnaryExpression,
      operator,
      argument: this.transformExpression(node.operand, context),
      prefix: true,
      location: this.getLocation(node, context),
    };
  }

  private transformUpdateExpression(node: ts.PostfixUnaryExpression, context: TransformContext): IRUpdateExpression {
    const operator = ts.tokenToString(node.operator) || "";
    
    return {
      kind: IRNodeKind.UpdateExpression,
      operator,
      argument: this.transformExpression(node.operand, context),
      prefix: false,
      location: this.getLocation(node, context),
    };
  }

  private transformConditionalExpression(node: ts.ConditionalExpression, context: TransformContext): IRConditionalExpression {
    return {
      kind: IRNodeKind.ConditionalExpression,
      test: this.transformExpression(node.condition, context),
      consequent: this.transformExpression(node.whenTrue, context),
      alternate: this.transformExpression(node.whenFalse, context),
      location: this.getLocation(node, context),
    };
  }

  private transformNewExpression(node: ts.NewExpression, context: TransformContext): IRNewExpression {
    return {
      kind: IRNodeKind.NewExpression,
      callee: this.transformExpression(node.expression, context),
      arguments: node.arguments?.map(arg => this.transformExpression(arg, context)) || [],
      location: this.getLocation(node, context),
    };
  }

  private transformThisExpression(node: ts.ThisExpression, context: TransformContext): IRThisExpression {
    return {
      kind: IRNodeKind.ThisExpression,
      location: this.getLocation(node, context),
    };
  }

  private transformFunctionExpression(
    node: ts.FunctionExpression | ts.ArrowFunction,
    context: TransformContext,
  ): IRFunctionExpression {
    // This is a simplified version - full implementation would handle parameters and body
    return {
      kind: ts.isArrowFunction(node) ? IRNodeKind.ArrowFunctionExpression : IRNodeKind.FunctionExpression,
      name: ts.isFunctionExpression(node) && node.name ? node.name.text : null,
      params: [], // Will be filled by declaration transformer
      body: { kind: IRNodeKind.BlockStatement, body: [], location: this.getLocation(node, context) },
      isAsync: !!node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword),
      isGenerator: ts.isFunctionExpression(node) && !!node.asteriskToken,
      location: this.getLocation(node, context),
    };
  }

  private transformTemplateLiteral(node: ts.TemplateExpression, context: TransformContext): IRTemplateLiteral {
    const quasis: IRTemplateElement[] = [];
    const expressions: IRExpression[] = [];

    // Add head
    quasis.push({
      kind: IRNodeKind.TemplateElement,
      value: {
        raw: node.head.text,
        cooked: node.head.text,
      },
      tail: false,
      location: this.getLocation(node.head, context),
    });

    // Process template spans
    for (const span of node.templateSpans) {
      expressions.push(this.transformExpression(span.expression, context));
      quasis.push({
        kind: IRNodeKind.TemplateElement,
        value: {
          raw: span.literal.text,
          cooked: span.literal.text,
        },
        tail: span === node.templateSpans[node.templateSpans.length - 1],
        location: this.getLocation(span.literal, context),
      });
    }

    return {
      kind: IRNodeKind.TemplateLiteral,
      quasis,
      expressions,
      location: this.getLocation(node, context),
    };
  }

  private transformTaggedTemplateExpression(node: ts.TaggedTemplateExpression, context: TransformContext): IRTaggedTemplateExpression {
    const quasi = ts.isTemplateExpression(node.template) 
      ? this.transformTemplateLiteral(node.template, context)
      : {
          kind: IRNodeKind.TemplateLiteral,
          quasis: [{
            kind: IRNodeKind.TemplateElement,
            value: { raw: node.template.text, cooked: node.template.text },
            tail: true,
            location: this.getLocation(node.template, context),
          }],
          expressions: [],
          location: this.getLocation(node.template, context),
        } as IRTemplateLiteral;

    return {
      kind: IRNodeKind.TaggedTemplateExpression,
      tag: this.transformExpression(node.tag, context),
      quasi,
      location: this.getLocation(node, context),
    };
  }

  private transformAwaitExpression(node: ts.AwaitExpression, context: TransformContext): IRAwaitExpression {
    return {
      kind: IRNodeKind.AwaitExpression,
      argument: this.transformExpression(node.expression, context),
      location: this.getLocation(node, context),
    };
  }

  private transformYieldExpression(node: ts.YieldExpression, context: TransformContext): IRYieldExpression {
    return {
      kind: IRNodeKind.YieldExpression,
      argument: node.expression ? this.transformExpression(node.expression, context) : null,
      delegate: !!node.asteriskToken,
      location: this.getLocation(node, context),
    };
  }

  private transformSpreadElement(node: ts.SpreadElement, context: TransformContext): IRSpreadElement {
    return {
      kind: IRNodeKind.SpreadElement,
      expression: this.transformExpression(node.expression, context),
      location: this.getLocation(node, context),
    };
  }

  private transformTypeOfExpression(node: ts.TypeOfExpression, context: TransformContext): IRUnaryExpression {
    return {
      kind: IRNodeKind.UnaryExpression,
      operator: "typeof",
      argument: this.transformExpression(node.expression, context),
      prefix: true,
      location: this.getLocation(node, context),
    };
  }

  private transformDeleteExpression(node: ts.DeleteExpression, context: TransformContext): IRUnaryExpression {
    return {
      kind: IRNodeKind.UnaryExpression,
      operator: "delete",
      argument: this.transformExpression(node.expression, context),
      prefix: true,
      location: this.getLocation(node, context),
    };
  }

  private transformAsExpression(node: ts.AsExpression, context: TransformContext): IRExpression {
    // Type assertions don't affect runtime behavior in our transpiler
    const expr = this.transformExpression(node.expression, context);
    
    // Check for const assertions
    if (ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName) && node.type.typeName.text === "const") {
      // Mark as const assertion for arrays/objects
      if (expr.kind === IRNodeKind.ArrayExpression || expr.kind === IRNodeKind.ObjectExpression) {
        (expr as any).isConstAssertion = true;
      }
    }
    
    return expr;
  }

  private transformSatisfiesExpression(node: ts.SatisfiesExpression, context: TransformContext): IRExpression {
    // Satisfies expressions are compile-time only
    return this.transformExpression(node.expression, context);
  }

  private transformNonNullExpression(node: ts.NonNullExpression, context: TransformContext): IRExpression {
    // Non-null assertions don't affect runtime behavior
    return this.transformExpression(node.expression, context);
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