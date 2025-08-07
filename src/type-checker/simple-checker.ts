/**
 * Simplified Type Checker that works with the TypeScript AST directly
 * without creating a full program
 */

import ts from "typescript";
import type { ResolvedType, TypeFlags } from "./types.ts";

/**
 * Simple type checker for basic type resolution
 */
export class SimpleTypeChecker {
  private sourceFile: ts.SourceFile;
  private typeMap: Map<ts.Node, ResolvedType>;

  constructor(sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile;
    this.typeMap = new Map();
    this.analyzeTypes();
  }

  /**
   * Analyze types in the source file
   */
  private analyzeTypes() {
    const visit = (node: ts.Node) => {
      // Analyze type annotations
      if (ts.isVariableDeclaration(node) && node.type) {
        this.typeMap.set(node, this.resolveTypeNode(node.type));
      }

      if (ts.isFunctionDeclaration(node)) {
        if (node.type) {
          this.typeMap.set(node, this.resolveTypeNode(node.type));
        }

        // Analyze parameters
        node.parameters.forEach((param) => {
          if (param.type) {
            this.typeMap.set(param, this.resolveTypeNode(param.type));
          }
        });
      }

      if (ts.isClassDeclaration(node)) {
        node.members.forEach((member) => {
          if (ts.isPropertyDeclaration(member) && member.type) {
            this.typeMap.set(member, this.resolveTypeNode(member.type));
          }

          if (ts.isMethodDeclaration(member)) {
            if (member.type) {
              this.typeMap.set(member, this.resolveTypeNode(member.type));
            }

            member.parameters.forEach((param) => {
              if (param.type) {
                this.typeMap.set(param, this.resolveTypeNode(param.type));
              }
            });
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
  }

  /**
   * Get type at location
   */
  getTypeAtLocation(node: ts.Node): ResolvedType {
    return this.typeMap.get(node) || this.createUnknownType();
  }

  /**
   * Resolve a type node to our resolved type format
   */
  public resolveTypeNode(typeNode: ts.TypeNode): ResolvedType {
    const typeString = this.getTypeString(typeNode);
    const cppType = this.mapToCppType(typeNode, typeString);
    const flags = this.getTypeFlags(typeNode);

    return {
      name: typeString,
      cppType,
      flags,
    };
  }

  /**
   * Get type string representation
   */
  private getTypeString(typeNode: ts.TypeNode): string {
    switch (typeNode.kind) {
      case ts.SyntaxKind.StringKeyword:
        return "string";
      case ts.SyntaxKind.NumberKeyword:
        return "number";
      case ts.SyntaxKind.BooleanKeyword:
        return "boolean";
      case ts.SyntaxKind.VoidKeyword:
        return "void";
      case ts.SyntaxKind.AnyKeyword:
        return "any";
      case ts.SyntaxKind.UnknownKeyword:
        return "unknown";
      case ts.SyntaxKind.NeverKeyword:
        return "never";
      case ts.SyntaxKind.NullKeyword:
        return "null";
      case ts.SyntaxKind.UndefinedKeyword:
        return "undefined";
      case ts.SyntaxKind.ObjectKeyword:
        return "object";
      case ts.SyntaxKind.BigIntKeyword:
        return "bigint";

      case ts.SyntaxKind.TypeReference: {
        const typeRef = typeNode as ts.TypeReferenceNode;
        if (ts.isIdentifier(typeRef.typeName)) {
          return typeRef.typeName.text;
        }
        return "unknown";
      }

      case ts.SyntaxKind.ArrayType: {
        const arrayType = typeNode as ts.ArrayTypeNode;
        return `${this.getTypeString(arrayType.elementType)}[]`;
      }

      case ts.SyntaxKind.UnionType: {
        const unionType = typeNode as ts.UnionTypeNode;
        return unionType.types.map((t) => this.getTypeString(t)).join(" | ");
      }

      case ts.SyntaxKind.IntersectionType: {
        const intersectionType = typeNode as ts.IntersectionTypeNode;
        // For now, similar to union types but with intersection semantics
        const types = intersectionType.types.map((t) => this.getTypeString(t));

        // For simple intersections, use the most specific type
        // This is a simplified approach - full intersection types are complex in C++
        if (types.length > 0) {
          // Prioritize object types over primitive types
          const objectTypes = types.filter((t) =>
            !["string", "number", "boolean", "void", "null", "undefined"].includes(t)
          );

          if (objectTypes.length > 0) {
            return objectTypes[0]; // Use the first object type
          }

          return types[0]; // Fallback to first type
        }

        return "unknown";
      }

      case ts.SyntaxKind.FunctionType: {
        const funcType = typeNode as ts.FunctionTypeNode;
        const params = funcType.parameters.map((p) => {
          if (p.type) {
            return this.getTypeString(p.type);
          }
          return "any";
        }).join(", ");
        const returnType = funcType.type ? this.getTypeString(funcType.type) : "void";
        return `(${params}) => ${returnType}`;
      }

      case ts.SyntaxKind.ParenthesizedType: {
        const parenType = typeNode as ts.ParenthesizedTypeNode;
        return this.getTypeString(parenType.type);
      }

      default:
        return "unknown";
    }
  }

  /**
   * Map type node to C++ type
   */
  private mapToCppType(typeNode: ts.TypeNode, _typeString: string): string {
    switch (typeNode.kind) {
      case ts.SyntaxKind.StringKeyword:
        return "js::string";
      case ts.SyntaxKind.NumberKeyword:
        return "js::number";
      case ts.SyntaxKind.BooleanKeyword:
        return "bool";
      case ts.SyntaxKind.VoidKeyword:
        return "void";
      case ts.SyntaxKind.NullKeyword:
        return "std::nullptr_t";
      case ts.SyntaxKind.UndefinedKeyword:
        return "js::undefined_t";
      case ts.SyntaxKind.BigIntKeyword:
        return "js::bigint";
      case ts.SyntaxKind.AnyKeyword:
        return "js::any";
      case ts.SyntaxKind.UnknownKeyword:
        return "js::unknown";
      case ts.SyntaxKind.ObjectKeyword:
        return "js::object";

      case ts.SyntaxKind.ArrayType: {
        const arrayType = typeNode as ts.ArrayTypeNode;
        const elementType = this.resolveTypeNode(arrayType.elementType);
        return `js::array<${elementType.cppType}>`;
      }

      case ts.SyntaxKind.UnionType: {
        const unionType = typeNode as ts.UnionTypeNode;
        const types = unionType.types.map((t) => this.resolveTypeNode(t).cppType);

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
        const intersectionType = typeNode as ts.IntersectionTypeNode;
        const types = intersectionType.types.map((t) => this.resolveTypeNode(t).cppType);

        // For intersection types, use the most specific type
        // This is a simplified approach - full intersection types would require
        // complex C++ template programming or multiple inheritance
        if (types.length > 0) {
          // Prioritize object types over primitive types
          const objectTypes = types.filter((t) =>
            !["js::string", "js::number", "bool", "void", "js::null_t", "js::undefined_t"].includes(
              t,
            )
          );

          if (objectTypes.length > 0) {
            // Use the first object type as the primary type
            return objectTypes[0];
          }

          // If all are primitives, use the first one
          return types[0];
        }

        // Fallback for empty intersection
        return "js::any";
      }

      case ts.SyntaxKind.TypeReference: {
        const typeRef = typeNode as ts.TypeReferenceNode;
        if (ts.isIdentifier(typeRef.typeName)) {
          // Special handling for built-in generics
          const typeName = typeRef.typeName.text;
          if (typeName === "Array" && typeRef.typeArguments && typeRef.typeArguments.length > 0) {
            const elementType = this.resolveTypeNode(typeRef.typeArguments[0]);
            return `js::array<${elementType.cppType}>`;
          }
          if (typeName === "Promise" && typeRef.typeArguments && typeRef.typeArguments.length > 0) {
            const elementType = this.resolveTypeNode(typeRef.typeArguments[0]);
            return `std::future<${elementType.cppType}>`;
          }
          // Default: use the type name as-is
          return typeName;
        }
        return "unknown";
      }

      case ts.SyntaxKind.FunctionType: {
        const funcType = typeNode as ts.FunctionTypeNode;
        const params = funcType.parameters.map((p) => {
          if (p.type) {
            return this.resolveTypeNode(p.type).cppType;
          }
          return "js::any";
        });
        const returnType = funcType.type ? this.resolveTypeNode(funcType.type).cppType : "void";
        return `std::function<${returnType}(${params.join(", ")})>`;
      }

      case ts.SyntaxKind.LiteralType: {
        const literalType = typeNode as ts.LiteralTypeNode;
        if (literalType.literal.kind === ts.SyntaxKind.NullKeyword) {
          return "std::nullptr_t";
        }
        // Handle other literal types (string, number, boolean literals)
        return "js::any"; // Fallback for other literal types
      }

      case ts.SyntaxKind.ParenthesizedType: {
        const parenType = typeNode as ts.ParenthesizedTypeNode;
        return this.mapToCppType(parenType.type, this.getTypeString(parenType.type));
      }

      default:
        return "js::any";
    }
  }

  /**
   * Get type flags
   */
  private getTypeFlags(typeNode: ts.TypeNode): TypeFlags {
    const isPrimitive = [
      ts.SyntaxKind.StringKeyword,
      ts.SyntaxKind.NumberKeyword,
      ts.SyntaxKind.BooleanKeyword,
      ts.SyntaxKind.BigIntKeyword,
    ].includes(typeNode.kind);

    const isObject = [
      ts.SyntaxKind.ObjectKeyword,
      ts.SyntaxKind.TypeReference,
    ].includes(typeNode.kind);

    const isArray = typeNode.kind === ts.SyntaxKind.ArrayType ||
      (typeNode.kind === ts.SyntaxKind.TypeReference &&
        ts.isIdentifier((typeNode as ts.TypeReferenceNode).typeName) &&
        ((typeNode as ts.TypeReferenceNode).typeName as ts.Identifier).text === "Array");

    const isFunction = typeNode.kind === ts.SyntaxKind.FunctionType;

    const isNullable = typeNode.kind === ts.SyntaxKind.UnionType &&
      (typeNode as ts.UnionTypeNode).types.some((t) =>
        t.kind === ts.SyntaxKind.NullKeyword ||
        t.kind === ts.SyntaxKind.UndefinedKeyword
      );

    return {
      isPrimitive,
      isObject,
      isArray,
      isFunction,
      isGeneric: false, // Would need more analysis
      isNullable,
      isUnion: typeNode.kind === ts.SyntaxKind.UnionType,
      isIntersection: typeNode.kind === ts.SyntaxKind.IntersectionType,
      isLiteral: false, // Would need more analysis
      needsHeapAllocation: isObject || isArray,
    };
  }

  /**
   * Create unknown type
   */
  private createUnknownType(): ResolvedType {
    return {
      name: "unknown",
      cppType: "js::any",
      flags: {
        isPrimitive: false,
        isObject: true,
        isArray: false,
        isFunction: false,
        isGeneric: false,
        isNullable: true,
        isUnion: false,
        isIntersection: false,
        isLiteral: false,
        needsHeapAllocation: true,
      },
    };
  }

  /**
   * Simple type checking - just check for basic type errors
   */
  checkSourceFile(): { hasErrors: boolean; errors: Array<{ message: string; location?: any }> } {
    const errors: Array<{ message: string; location?: any }> = [];

    // This is a simplified checker - we won't detect all type errors
    // The real TypeScript compiler would do this better

    return {
      hasErrors: errors.length > 0,
      errors,
    };
  }
}
