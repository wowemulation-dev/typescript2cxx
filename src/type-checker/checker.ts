/**
 * TypeScript Type Checker Integration
 *
 * Provides type information extraction and analysis using the TypeScript Compiler API
 */

import ts from "typescript";
import type { ResolvedType, TypeCheckerOptions, TypeCheckResult } from "./types.ts";

/**
 * TypeScript Type Checker wrapper
 */
export class TypeChecker {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private sourceFile: ts.SourceFile;
  private options: TypeCheckerOptions;

  constructor(
    sourceFile: ts.SourceFile,
    source: string,
    options: TypeCheckerOptions = {},
  ) {
    this.sourceFile = sourceFile;
    this.options = options;

    // Create a minimal program with type checking
    this.program = this.createProgram(sourceFile, source);
    this.checker = this.program.getTypeChecker();
  }

  /**
   * Create a TypeScript program for type checking
   */
  private createProgram(sourceFile: ts.SourceFile, source: string): ts.Program {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      lib: ["lib.es2022.d.ts"],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true,
      noLib: false,
      allowJs: true,
      ...this.options.compilerOptions,
    };

    // Create custom compiler host
    const host = this.createCompilerHost(sourceFile, source, compilerOptions);

    return ts.createProgram([sourceFile.fileName], compilerOptions, host);
  }

  /**
   * Create a custom compiler host with virtual file system
   */
  private createCompilerHost(
    sourceFile: ts.SourceFile,
    source: string,
    options: ts.CompilerOptions,
  ): ts.CompilerHost {
    const defaultHost = ts.createCompilerHost(options);

    return {
      getSourceFile: (
        fileName: string,
        languageVersion: ts.ScriptTarget,
        onError?: (message: string) => void,
      ): ts.SourceFile | undefined => {
        // Use our source file for the main file
        if (fileName === sourceFile.fileName) {
          return sourceFile;
        }

        // Try to get lib files from default host
        if (fileName.includes("lib.") && fileName.endsWith(".d.ts")) {
          try {
            return defaultHost.getSourceFile(fileName, languageVersion, onError);
          } catch {
            // Return minimal lib if default fails
            return undefined;
          }
        }

        return undefined;
      },
      writeFile: () => {
        // No-op since we're not emitting
      },
      getCurrentDirectory: () => defaultHost.getCurrentDirectory(),
      getDirectories: (path: string) => defaultHost.getDirectories?.(path) || [],
      fileExists: (fileName: string) => {
        if (fileName === sourceFile.fileName) return true;
        try {
          return defaultHost.fileExists(fileName);
        } catch {
          return false;
        }
      },
      readFile: (fileName: string) => {
        if (fileName === sourceFile.fileName) return source;
        try {
          return defaultHost.readFile(fileName);
        } catch {
          return undefined;
        }
      },
      getCanonicalFileName: (fileName: string) => defaultHost.getCanonicalFileName(fileName),
      useCaseSensitiveFileNames: () => defaultHost.useCaseSensitiveFileNames(),
      getNewLine: () => defaultHost.getNewLine(),
      getDefaultLibFileName: (options: ts.CompilerOptions) =>
        defaultHost.getDefaultLibFileName(options),
    };
  }

  /**
   * Get type of a node
   */
  getTypeAtLocation(node: ts.Node): ResolvedType {
    const type = this.checker.getTypeAtLocation(node);
    return this.convertType(type, node);
  }

  /**
   * Get symbol at location
   */
  getSymbolAtLocation(node: ts.Node): ts.Symbol | undefined {
    return this.checker.getSymbolAtLocation(node);
  }

  /**
   * Check if a type is assignable to another
   */
  isAssignableTo(source: ts.Type, target: ts.Type): boolean {
    return this.checker.isTypeAssignableTo(source, target);
  }

  /**
   * Get the return type of a function
   */
  getReturnType(node: ts.FunctionLikeDeclaration): ResolvedType {
    const signature = this.checker.getSignatureFromDeclaration(node);
    if (signature) {
      const returnType = this.checker.getReturnTypeOfSignature(signature);
      return this.convertType(returnType, node);
    }
    return this.createUnknownType();
  }

  /**
   * Get parameter types of a function
   */
  getParameterTypes(node: ts.FunctionLikeDeclaration): ResolvedType[] {
    const signature = this.checker.getSignatureFromDeclaration(node);
    if (!signature) return [];

    return signature.parameters.map((param) => {
      const type = this.checker.getTypeOfSymbolAtLocation(param, node);
      return this.convertType(type, param.valueDeclaration || node);
    });
  }

  /**
   * Check entire source file for type errors
   */
  checkSourceFile(): TypeCheckResult {
    const diagnostics = [
      ...this.program.getSemanticDiagnostics(this.sourceFile),
      ...this.program.getSyntacticDiagnostics(this.sourceFile),
    ];

    const errors = diagnostics.map((diag) => ({
      code: diag.code,
      message: ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
      location: diag.file && diag.start !== undefined
        ? this.getLocationFromPosition(diag.file, diag.start)
        : undefined,
    }));

    return {
      hasErrors: errors.length > 0,
      errors,
      program: this.program,
      checker: this.checker,
    };
  }

  /**
   * Convert TypeScript type to our resolved type format
   */
  private convertType(type: ts.Type, node: ts.Node): ResolvedType {
    const typeString = this.checker.typeToString(type);
    const flags = this.getTypeFlags(type);

    // Determine C++ type mapping
    const cppType = this.mapToCppType(type, typeString);

    // Check for special memory management hints
    const symbol = type.getSymbol();
    const memoryHint = this.getMemoryManagementHint(symbol, node);

    return {
      name: typeString,
      cppType,
      flags,
      memoryHint,
      typeArguments: this.getTypeArguments(type),
      members: this.getTypeMembers(type),
      callSignatures: this.getCallSignatures(type),
    };
  }

  /**
   * Get type flags
   */
  private getTypeFlags(type: ts.Type) {
    return {
      isPrimitive: !!(type.flags & (
        ts.TypeFlags.String |
        ts.TypeFlags.Number |
        ts.TypeFlags.Boolean |
        ts.TypeFlags.BigInt |
        ts.TypeFlags.ESSymbol
      )),
      isObject: !!(type.flags & ts.TypeFlags.Object),
      isArray: this.checker.isArrayType(type),
      isFunction: type.getCallSignatures().length > 0,
      isGeneric: !!(type.flags & ts.TypeFlags.TypeParameter),
      isNullable: !!(type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)),
      isUnion: !!(type.flags & ts.TypeFlags.Union),
      isIntersection: !!(type.flags & ts.TypeFlags.Intersection),
      isLiteral: !!(type.flags & (
        ts.TypeFlags.StringLiteral |
        ts.TypeFlags.NumberLiteral |
        ts.TypeFlags.BooleanLiteral
      )),
      needsHeapAllocation: this.needsHeapAllocation(type),
    };
  }

  /**
   * Map TypeScript type to C++ type
   */
  private mapToCppType(type: ts.Type, typeString: string): string {
    // Check custom mappings first
    if (this.options.typeMappings?.[typeString]) {
      return this.options.typeMappings[typeString];
    }

    // Primitive types
    if (type.flags & ts.TypeFlags.String) return "js::string";
    if (type.flags & ts.TypeFlags.Number) return "js::number";
    if (type.flags & ts.TypeFlags.Boolean) return "bool";
    if (type.flags & ts.TypeFlags.Void) return "void";
    if (type.flags & ts.TypeFlags.Null) return "std::nullptr_t";
    if (type.flags & ts.TypeFlags.Undefined) return "js::undefined_t";
    if (type.flags & ts.TypeFlags.BigInt) return "js::bigint";

    // Array types
    if (this.checker.isArrayType(type)) {
      const typeArgs = (type as any).typeArguments;
      if (typeArgs && typeArgs.length > 0) {
        const elementType = this.convertType(
          typeArgs[0],
          type.symbol?.valueDeclaration || this.sourceFile,
        );
        return `js::array<${elementType.cppType}>`;
      }
      return "js::array<js::any>";
    }

    // Function types
    if (type.getCallSignatures().length > 0) {
      const signature = type.getCallSignatures()[0];
      const params = signature.parameters.map((p) =>
        this.checker.typeToString(
          this.checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || this.sourceFile),
        )
      );
      const returnType = this.checker.typeToString(signature.getReturnType());
      return `std::function<${returnType}(${params.join(", ")})>`;
    }

    // Object types
    if (type.flags & ts.TypeFlags.Object) {
      const symbol = type.getSymbol();
      if (symbol && symbol.name) {
        // Class or interface
        return symbol.name;
      }
      return "js::object";
    }

    // Union types
    if (type.flags & ts.TypeFlags.Union) {
      const unionTypes = (type as ts.UnionType).types;
      const cppTypes = unionTypes.map((t) => this.convertType(t, this.sourceFile).cppType);
      return `std::variant<${cppTypes.join(", ")}>`;
    }

    // Default
    return "js::any";
  }

  /**
   * Check if type needs heap allocation
   */
  private needsHeapAllocation(type: ts.Type): boolean {
    // Primitives don't need heap allocation
    if (
      type.flags & (
        ts.TypeFlags.String |
        ts.TypeFlags.Number |
        ts.TypeFlags.Boolean |
        ts.TypeFlags.Void |
        ts.TypeFlags.Null |
        ts.TypeFlags.Undefined
      )
    ) {
      return false;
    }

    // Objects and arrays need heap allocation
    if (type.flags & ts.TypeFlags.Object) {
      return true;
    }

    return false;
  }

  /**
   * Get memory management hint from JSDoc or decorators
   */
  private getMemoryManagementHint(
    symbol: ts.Symbol | undefined,
    _node: ts.Node,
  ): string | undefined {
    if (!symbol) return undefined;

    // Check JSDoc comments
    const jsDocs = symbol.getJsDocTags();
    const memoryTag = jsDocs.find((tag) =>
      tag.name === "memory" ||
      tag.name === "weak" ||
      tag.name === "shared" ||
      tag.name === "unique"
    );

    if (memoryTag) {
      if (memoryTag.name === "memory") {
        return memoryTag.text?.[0]?.text;
      }
      return memoryTag.name;
    }

    return undefined;
  }

  /**
   * Get type arguments for generic types
   */
  private getTypeArguments(type: ts.Type): ResolvedType[] | undefined {
    const typeArgs = (type as any).typeArguments;
    if (!typeArgs || typeArgs.length === 0) return undefined;

    return typeArgs.map((arg: ts.Type) => this.convertType(arg, this.sourceFile));
  }

  /**
   * Get type members (for objects and classes)
   */
  private getTypeMembers(type: ts.Type): Map<string, ResolvedType> | undefined {
    if (!(type.flags & ts.TypeFlags.Object)) return undefined;

    const members = new Map<string, ResolvedType>();
    const properties = type.getProperties();

    for (const prop of properties) {
      const propType = this.checker.getTypeOfSymbolAtLocation(prop, this.sourceFile);
      members.set(prop.name, this.convertType(propType, this.sourceFile));
    }

    return members.size > 0 ? members : undefined;
  }

  /**
   * Get call signatures for function types
   */
  private getCallSignatures(type: ts.Type): any[] | undefined {
    const signatures = type.getCallSignatures();
    if (signatures.length === 0) return undefined;

    return signatures.map((sig) => ({
      parameters: sig.parameters.map((param) => ({
        name: param.name,
        type: this.convertType(
          this.checker.getTypeOfSymbolAtLocation(param, this.sourceFile),
          this.sourceFile,
        ),
        optional: !!(param.flags & ts.SymbolFlags.Optional),
      })),
      returnType: this.convertType(sig.getReturnType(), this.sourceFile),
    }));
  }

  /**
   * Get location from position
   */
  private getLocationFromPosition(file: ts.SourceFile, position: number) {
    const { line, character } = file.getLineAndCharacterOfPosition(position);
    return {
      file: file.fileName,
      line: line + 1,
      column: character + 1,
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
}

/**
 * Export TypeScript types for convenience
 */
export { ts };
