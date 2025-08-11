/**
 * Declaration transformation utilities for AST to IR transformation
 */

import { ts } from "../../ast/parser.ts";
import { MemoryAnnotation, MemoryAnnotationParser } from "../../memory/annotations.ts";
import { AccessModifier, IRNodeKind, MemoryManagement, VariableKind } from "../../ir/nodes.ts";
import type {
  IRClassDeclaration,
  IRClassMember,
  IREnumDeclaration,
  IRFunctionDeclaration,
  IRInterfaceDeclaration,
  IRMethodDefinition,
  IRNamespaceDeclaration,
  IRParameter,
  IRPropertyDefinition,
  IRVariableDeclaration,
  IRVariableDeclarator,
  IRDecorator,
  IRDecoratorMetadata,
  IREnumMember,
  IRBlockStatement,
  IRTemplateParameter,
} from "../../ir/nodes.ts";
import type { TransformContext } from "../context.ts";
import type { ExpressionTransformer } from "./expression-transformer.ts";
import type { StatementTransformer } from "./statement-transformer.ts";

export class DeclarationTransformer {
  constructor(
    private expressionTransformer: ExpressionTransformer,
  ) {}

  setStatementTransformer(stmtTransformer: StatementTransformer): void {
    this.statementTransformer = stmtTransformer;
  }

  private statementTransformer?: StatementTransformer;

  transformVariableStatement(node: ts.VariableStatement, context: TransformContext): IRVariableDeclaration {
    return this.transformVariableDeclarationList(node.declarationList, context);
  }

  transformVariableDeclarationList(node: ts.VariableDeclarationList, context: TransformContext): IRVariableDeclaration {
    const kind = this.mapVariableKind(node.flags);
    
    const declarations = node.declarations.map(decl => 
      this.transformVariableDeclarator(decl, context)
    );

    return {
      kind: IRNodeKind.VariableDeclaration,
      declarations,
      kind: kind,
      location: this.getLocation(node, context),
    };
  }

  private transformVariableDeclarator(node: ts.VariableDeclaration, context: TransformContext): IRVariableDeclarator {
    // Parse memory annotations from JSDoc
    const memoryAnnotation = this.parseMemoryAnnotations(node, context);
    const memory = memoryAnnotation ? this.mapMemoryAnnotation(memoryAnnotation) : MemoryManagement.Auto;

    return {
      kind: IRNodeKind.VariableDeclarator,
      id: this.transformBindingPattern(node.name, context),
      init: node.initializer ? this.expressionTransformer.transformExpression(node.initializer, context) : null,
      type: this.resolveType(node.type, context),
      memory,
      location: this.getLocation(node, context),
    };
  }

  transformFunctionDeclaration(node: ts.FunctionDeclaration, context: TransformContext): IRFunctionDeclaration {
    if (!node.name) {
      throw new Error("Function declaration must have a name");
    }

    // Parse decorators
    const decorators = this.transformDecorators(node, context);

    // Parse template parameters
    const templateParams = node.typeParameters?.map(tp => this.transformTemplateParameter(tp, context)) || [];

    // Parse parameters
    const params = node.parameters.map(param => this.transformParameter(param, context));

    // Parse body
    const body = node.body ? this.transformBlockStatement(node.body, context) : null;

    return {
      kind: IRNodeKind.FunctionDeclaration,
      name: node.name.text,
      params,
      body,
      returnType: this.resolveType(node.type, context),
      isAsync: this.hasModifier(node, ts.SyntaxKind.AsyncKeyword),
      isGenerator: !!node.asteriskToken,
      isExported: this.hasModifier(node, ts.SyntaxKind.ExportKeyword),
      decorators,
      templateParams,
      location: this.getLocation(node, context),
    };
  }

  transformClassDeclaration(node: ts.ClassDeclaration, context: TransformContext): IRClassDeclaration {
    if (!node.name) {
      throw new Error("Class declaration must have a name");
    }

    // Parse decorators
    const decorators = this.transformDecorators(node, context);

    // Parse heritage clause (extends)
    const superClass = node.heritageClauses?.find(clause => 
      clause.token === ts.SyntaxKind.ExtendsKeyword
    )?.types[0]?.expression;

    const superClassName = superClass && ts.isIdentifier(superClass) ? superClass.text : null;

    // Parse members
    const members = node.members.map(member => this.transformClassMember(member, context)).filter(Boolean) as IRClassMember[];

    return {
      kind: IRNodeKind.ClassDeclaration,
      name: node.name.text,
      superClass: superClassName,
      members,
      isExported: this.hasModifier(node, ts.SyntaxKind.ExportKeyword),
      decorators,
      location: this.getLocation(node, context),
    };
  }

  private transformClassMember(node: ts.ClassElement, context: TransformContext): IRClassMember | null {
    if (ts.isPropertyDeclaration(node)) {
      return this.transformPropertyDefinition(node, context);
    } else if (ts.isMethodDeclaration(node)) {
      return this.transformMethodDefinition(node, context);
    } else if (ts.isConstructorDeclaration(node)) {
      return this.transformConstructor(node, context);
    } else if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
      return this.transformAccessorDefinition(node, context);
    } else {
      context.errorReporter.reportWarning({
        message: `Unsupported class member kind: ${ts.SyntaxKind[node.kind]}`,
        location: this.getLocation(node, context),
      });
      return null;
    }
  }

  private transformPropertyDefinition(node: ts.PropertyDeclaration, context: TransformContext): IRPropertyDefinition {
    const decorators = this.transformDecorators(node, context);
    const access = this.getAccessModifier(node);
    const memoryAnnotation = this.parseMemoryAnnotations(node, context);
    const memory = memoryAnnotation ? this.mapMemoryAnnotation(memoryAnnotation) : MemoryManagement.Auto;

    return {
      kind: IRNodeKind.PropertyDefinition,
      name: ts.isIdentifier(node.name) ? node.name.text : "[computed]",
      type: this.resolveType(node.type, context),
      initializer: node.initializer ? this.expressionTransformer.transformExpression(node.initializer, context) : null,
      isStatic: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
      isReadonly: this.hasModifier(node, ts.SyntaxKind.ReadonlyKeyword),
      access,
      decorators,
      memory,
      location: this.getLocation(node, context),
    };
  }

  private transformMethodDefinition(node: ts.MethodDeclaration, context: TransformContext): IRMethodDefinition {
    const decorators = this.transformDecorators(node, context);
    const access = this.getAccessModifier(node);
    const params = node.parameters.map(param => this.transformParameter(param, context));
    const body = node.body ? this.transformBlockStatement(node.body, context) : null;

    return {
      kind: IRNodeKind.MethodDefinition,
      name: ts.isIdentifier(node.name) ? node.name.text : "[computed]",
      params,
      body,
      returnType: this.resolveType(node.type, context),
      isStatic: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
      isAsync: this.hasModifier(node, ts.SyntaxKind.AsyncKeyword),
      isGenerator: !!node.asteriskToken,
      isAbstract: this.hasModifier(node, ts.SyntaxKind.AbstractKeyword),
      access,
      decorators,
      location: this.getLocation(node, context),
    };
  }

  private transformConstructor(node: ts.ConstructorDeclaration, context: TransformContext): IRMethodDefinition {
    const params = node.parameters.map(param => this.transformParameter(param, context));
    const body = node.body ? this.transformBlockStatement(node.body, context) : null;

    return {
      kind: IRNodeKind.MethodDefinition,
      name: "constructor",
      params,
      body,
      returnType: null, // Constructors don't have return types
      isConstructor: true,
      isStatic: false,
      isAsync: false,
      isGenerator: false,
      isAbstract: false,
      access: AccessModifier.Public,
      decorators: [],
      location: this.getLocation(node, context),
    };
  }

  private transformAccessorDefinition(
    node: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration,
    context: TransformContext,
  ): IRMethodDefinition {
    const access = this.getAccessModifier(node);
    const params = node.parameters.map(param => this.transformParameter(param, context));
    const body = node.body ? this.transformBlockStatement(node.body, context) : null;
    const isGetter = ts.isGetAccessorDeclaration(node);

    return {
      kind: IRNodeKind.MethodDefinition,
      name: ts.isIdentifier(node.name) ? node.name.text : "[computed]",
      params,
      body,
      returnType: this.resolveType(node.type, context),
      isStatic: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
      isAsync: false,
      isGenerator: false,
      isAbstract: false,
      isGetter,
      isSetter: !isGetter,
      access,
      decorators: [],
      location: this.getLocation(node, context),
    };
  }

  transformInterfaceDeclaration(node: ts.InterfaceDeclaration, context: TransformContext): IRInterfaceDeclaration {
    return {
      kind: IRNodeKind.InterfaceDeclaration,
      name: node.name.text,
      members: [], // Simplified - would need full interface member transformation
      isExported: this.hasModifier(node, ts.SyntaxKind.ExportKeyword),
      location: this.getLocation(node, context),
    };
  }

  transformEnumDeclaration(node: ts.EnumDeclaration, context: TransformContext): IREnumDeclaration {
    const members = node.members.map(member => {
      const enumMember: IREnumMember = {
        kind: IRNodeKind.EnumMember,
        name: ts.isIdentifier(member.name) ? member.name.text : member.name.getText(),
        initializer: member.initializer ? this.expressionTransformer.transformExpression(member.initializer, context) : null,
        location: this.getLocation(member, context),
      };
      return enumMember;
    });

    return {
      kind: IRNodeKind.EnumDeclaration,
      name: node.name.text,
      members,
      isExported: this.hasModifier(node, ts.SyntaxKind.ExportKeyword),
      location: this.getLocation(node, context),
    };
  }

  transformNamespaceDeclaration(node: ts.ModuleDeclaration, context: TransformContext): IRNamespaceDeclaration | null {
    if (!node.name || !ts.isIdentifier(node.name) || !node.body || !ts.isModuleBlock(node.body)) {
      return null;
    }

    const body = this.transformBlockStatement(node.body as any, context);

    return {
      kind: IRNodeKind.NamespaceDeclaration,
      name: node.name.text,
      body,
      isExported: this.hasModifier(node, ts.SyntaxKind.ExportKeyword),
      location: this.getLocation(node, context),
    };
  }

  private transformParameter(node: ts.ParameterDeclaration, context: TransformContext): IRParameter {
    const name = ts.isIdentifier(node.name) ? node.name.text : "[pattern]";
    
    return {
      kind: IRNodeKind.Parameter,
      name,
      type: this.resolveType(node.type, context),
      defaultValue: node.initializer ? this.expressionTransformer.transformExpression(node.initializer, context) : null,
      rest: !!node.dotDotDotToken,
      optional: !!node.questionToken,
      location: this.getLocation(node, context),
    };
  }

  private transformTemplateParameter(node: ts.TypeParameterDeclaration, context: TransformContext): IRTemplateParameter {
    return {
      kind: IRNodeKind.TemplateParameter,
      name: node.name.text,
      constraint: node.constraint ? this.resolveType(node.constraint, context) : null,
      default: node.default ? this.resolveType(node.default, context) : null,
      isConst: this.hasModifier(node as any, ts.SyntaxKind.ConstKeyword),
      location: this.getLocation(node, context),
    };
  }

  private transformDecorators(node: ts.Node, context: TransformContext): IRDecorator[] | IRDecoratorMetadata {
    // TypeScript compiler API doesn't expose decorators easily
    // This is a simplified implementation
    if (!('decorators' in node) || !(node as any).decorators) {
      return [];
    }

    const decorators = (node as any).decorators as ts.NodeArray<ts.Decorator>;
    
    return decorators.map(decorator => {
      const name = ts.isIdentifier(decorator.expression) 
        ? decorator.expression.text
        : decorator.expression.getText();

      const decoratorIR: IRDecorator = {
        kind: IRNodeKind.Decorator,
        name,
        arguments: [], // Simplified
        location: this.getLocation(decorator, context),
      };

      return decoratorIR;
    });
  }

  private transformBindingPattern(node: ts.BindingName, context: TransformContext): any {
    if (ts.isIdentifier(node)) {
      return {
        kind: IRNodeKind.Identifier,
        name: node.text,
        location: this.getLocation(node, context),
      };
    } else if (ts.isArrayBindingPattern(node)) {
      // Array destructuring
      return {
        kind: IRNodeKind.ArrayPattern,
        elements: node.elements.map(element => {
          if (ts.isOmittedExpression(element)) {
            return null;
          }
          return this.transformBindingPattern(element.name, context);
        }),
        location: this.getLocation(node, context),
      };
    } else if (ts.isObjectBindingPattern(node)) {
      // Object destructuring
      return {
        kind: IRNodeKind.ObjectPattern,
        properties: node.elements.map(element => ({
          kind: IRNodeKind.ObjectPatternProperty,
          key: ts.isIdentifier(element.propertyName || element.name) 
            ? { kind: IRNodeKind.Identifier, name: (element.propertyName || element.name).text, location: this.getLocation(element, context) }
            : { kind: IRNodeKind.Identifier, name: "unknown", location: this.getLocation(element, context) },
          value: this.transformBindingPattern(element.name, context),
          location: this.getLocation(element, context),
        })),
        location: this.getLocation(node, context),
      };
    } else {
      return {
        kind: IRNodeKind.Identifier,
        name: "_unknown",
        location: this.getLocation(node, context),
      };
    }
  }

  private transformBlockStatement(node: ts.Block | ts.ModuleBlock, context: TransformContext): IRBlockStatement {
    const statements = ('statements' in node ? node.statements : []).map(stmt => {
      if (this.statementTransformer) {
        return this.statementTransformer.transformStatement(stmt, context);
      } else {
        // Fallback - this shouldn't happen if properly wired
        context.errorReporter.reportWarning({
          message: "Statement transformer not available",
          location: this.getLocation(stmt, context),
        });
        return {
          kind: IRNodeKind.ExpressionStatement,
          expression: {
            kind: IRNodeKind.Literal,
            value: "/* statement */",
            raw: "/* statement */",
            literalType: "string",
            location: this.getLocation(stmt, context),
          },
          location: this.getLocation(stmt, context),
        } as any;
      }
    });

    return {
      kind: IRNodeKind.BlockStatement,
      body: statements,
      location: this.getLocation(node, context),
    };
  }

  private mapVariableKind(flags: ts.NodeFlags): VariableKind {
    if (flags & ts.NodeFlags.Const) return VariableKind.Const;
    if (flags & ts.NodeFlags.Let) return VariableKind.Let;
    return VariableKind.Var;
  }

  private getAccessModifier(node: ts.Node): AccessModifier {
    if (!('modifiers' in node) || !(node as any).modifiers) {
      return AccessModifier.Public;
    }

    const modifiers = (node as any).modifiers as ts.NodeArray<ts.Modifier>;
    
    for (const modifier of modifiers) {
      switch (modifier.kind) {
        case ts.SyntaxKind.PrivateKeyword:
          return AccessModifier.Private;
        case ts.SyntaxKind.ProtectedKeyword:
          return AccessModifier.Protected;
        case ts.SyntaxKind.PublicKeyword:
          return AccessModifier.Public;
      }
    }

    return AccessModifier.Public;
  }

  private hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    if (!('modifiers' in node) || !(node as any).modifiers) {
      return false;
    }

    const modifiers = (node as any).modifiers as ts.NodeArray<ts.Modifier>;
    return modifiers.some(modifier => modifier.kind === kind);
  }

  private parseMemoryAnnotations(node: ts.Node, context: TransformContext): MemoryAnnotation | null {
    // Simplified memory annotation parsing from JSDoc
    const jsDoc = (node as any).jsDoc;
    if (!jsDoc || !jsDoc.length) {
      return null;
    }

    const comment = jsDoc[0].comment;
    if (!comment) {
      return null;
    }

    const parser = new MemoryAnnotationParser();
    return parser.parse(comment);
  }

  private mapMemoryAnnotation(annotation: MemoryAnnotation): MemoryManagement {
    switch (annotation.type) {
      case "shared":
        return MemoryManagement.Shared;
      case "unique":
        return MemoryManagement.Unique;
      case "weak":
        return MemoryManagement.Weak;
      case "raw":
        return MemoryManagement.Raw;
      case "value":
        return MemoryManagement.Value;
      default:
        return MemoryManagement.Auto;
    }
  }

  private resolveType(typeNode: ts.TypeNode | undefined, context: TransformContext): string | null {
    if (!typeNode) {
      return null;
    }

    // Use the type checker to resolve the type
    try {
      return context.typeChecker.resolveType(typeNode);
    } catch (error) {
      context.errorReporter.reportWarning({
        message: `Failed to resolve type: ${error.message}`,
        location: this.getLocation(typeNode, context),
      });
      return "any";
    }
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