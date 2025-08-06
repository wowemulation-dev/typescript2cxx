/**
 * TypeScript AST parser using TypeScript Compiler API
 */

import ts from "typescript";
import { ParseError } from "../errors.ts";
import type { SourceLocation } from "../types.ts";
import { SimpleTypeChecker } from "../type-checker/simple-checker.ts";
import type { TypeCheckResult } from "../type-checker/types.ts";

/**
 * Parse options
 */
export interface ParseOptions {
  /** Source file name */
  filename?: string;

  /** TypeScript configuration */
  tsx?: boolean;
  decorators?: boolean;
  dynamicImport?: boolean;

  /** Target ECMAScript version */
  target?:
    | "es3"
    | "es5"
    | "es2015"
    | "es2016"
    | "es2017"
    | "es2018"
    | "es2019"
    | "es2020"
    | "es2021"
    | "es2022";

  /** Syntax mode */
  syntax?: "typescript" | "ecmascript";

  /** Enable type checking */
  typeCheck?: boolean;

  /** Type checking options */
  typeCheckOptions?: {
    /** Additional type definitions */
    typeDefinitions?: string[];

    /** Custom type mappings */
    typeMappings?: Record<string, string>;
  };
}

/**
 * Parse result
 */
export interface ParseResult {
  /** Parsed AST (TypeScript SourceFile) */
  ast: ts.SourceFile;

  /** Source file */
  filename: string;

  /** Parse time in ms */
  parseTime: number;

  /** Detected features */
  features: DetectedFeatures;

  /** Type checker instance */
  typeChecker?: SimpleTypeChecker;

  /** Type check result */
  typeCheckResult?: TypeCheckResult;
}

/**
 * Detected TypeScript features
 */
export interface DetectedFeatures {
  /** Uses async/await */
  hasAsync: boolean;

  /** Uses generators */
  hasGenerators: boolean;

  /** Uses decorators */
  hasDecorators: boolean;

  /** Uses JSX */
  hasJSX: boolean;

  /** Uses dynamic imports */
  hasDynamicImports: boolean;

  /** Uses BigInt */
  hasBigInt: boolean;

  /** Uses optional chaining */
  hasOptionalChaining: boolean;

  /** Uses nullish coalescing */
  hasNullishCoalescing: boolean;

  /** Uses private fields */
  hasPrivateFields: boolean;

  /** Uses template literals */
  hasTemplateLiterals: boolean;

  /** Uses const assertions */
  hasConstAssertions: boolean;

  /** TypeScript version features */
  typeScriptFeatures: {
    /** Uses satisfies operator */
    satisfies: boolean;

    /** Uses const type parameters */
    constTypeParams: boolean;

    /** Uses template literal types */
    templateLiteralTypes: boolean;

    /** Uses conditional types */
    conditionalTypes: boolean;

    /** Uses mapped types */
    mappedTypes: boolean;
  };
}

/**
 * Map target string to TypeScript ScriptTarget
 */
function getScriptTarget(target?: string): ts.ScriptTarget {
  switch (target) {
    case "es3":
      return ts.ScriptTarget.ES3;
    case "es5":
      return ts.ScriptTarget.ES5;
    case "es2015":
      return ts.ScriptTarget.ES2015;
    case "es2016":
      return ts.ScriptTarget.ES2016;
    case "es2017":
      return ts.ScriptTarget.ES2017;
    case "es2018":
      return ts.ScriptTarget.ES2018;
    case "es2019":
      return ts.ScriptTarget.ES2019;
    case "es2020":
      return ts.ScriptTarget.ES2020;
    case "es2021":
      return ts.ScriptTarget.ES2021;
    case "es2022":
      return ts.ScriptTarget.ES2022;
    default:
      return ts.ScriptTarget.ES2022;
  }
}

/**
 * Parse TypeScript source code
 */
export function parseTypeScript(
  source: string,
  options: ParseOptions = {},
): ParseResult {
  const startTime = performance.now();

  try {
    // Create source file
    const scriptKind = options.tsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      options.filename ?? "<anonymous>",
      source,
      getScriptTarget(options.target),
      true, // setParentNodes
      scriptKind,
    );

    // Check for parse errors by creating a program to get diagnostics
    const program = ts.createProgram([options.filename ?? "<anonymous>"], {
      target: getScriptTarget(options.target),
      allowJs: true,
    }, {
      getSourceFile: (fileName) =>
        fileName === (options.filename ?? "<anonymous>") ? sourceFile : undefined,
      writeFile: () => {},
      getCurrentDirectory: () => "",
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => "",
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      getDefaultLibFileName: () => "lib.d.ts",
    });

    const diagnostics = program.getSyntacticDiagnostics(sourceFile);
    if (diagnostics.length > 0) {
      const firstError = diagnostics[0];
      const location = getDiagnosticLocation(firstError, sourceFile);
      throw new ParseError(
        ts.flattenDiagnosticMessageText(firstError.messageText, "\n"),
        location,
      );
    }

    // Detect features
    const features = detectFeatures(sourceFile);

    const parseTime = performance.now() - startTime;

    // Create type checker if requested
    let typeChecker: SimpleTypeChecker | undefined;
    let typeCheckResult: TypeCheckResult | undefined;

    if (options.typeCheck) {
      typeChecker = new SimpleTypeChecker(sourceFile);

      // Simple type check result
      const checkResult = typeChecker.checkSourceFile();
      typeCheckResult = {
        hasErrors: checkResult.hasErrors,
        errors: checkResult.errors.map((e) => ({
          code: 0,
          message: e.message,
          location: e.location,
        })),
        program: program,
        checker: undefined as any, // Simple checker doesn't have full TS checker
      };
    }

    return {
      ast: sourceFile,
      filename: options.filename ?? "<anonymous>",
      parseTime,
      features,
      typeChecker,
      typeCheckResult,
    };
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    // Convert TypeScript error to our error type
    throw new ParseError(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Parse TypeScript file
 */
export async function parseTypeScriptFile(
  filePath: string,
  options: ParseOptions = {},
): Promise<ParseResult> {
  try {
    const source = await Deno.readTextFile(filePath);
    return parseTypeScript(source, {
      ...options,
      filename: filePath,
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new ParseError(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Detect features used in the AST
 */
function detectFeatures(sourceFile: ts.SourceFile): DetectedFeatures {
  const features: DetectedFeatures = {
    hasAsync: false,
    hasGenerators: false,
    hasDecorators: false,
    hasJSX: false,
    hasDynamicImports: false,
    hasBigInt: false,
    hasOptionalChaining: false,
    hasNullishCoalescing: false,
    hasPrivateFields: false,
    hasTemplateLiterals: false,
    hasConstAssertions: false,
    typeScriptFeatures: {
      satisfies: false,
      constTypeParams: false,
      templateLiteralTypes: false,
      conditionalTypes: false,
      mappedTypes: false,
    },
  };

  // Create a visitor to walk the AST
  const visitor = new FeatureDetector(features);
  visitor.visit(sourceFile);

  return features;
}

/**
 * AST visitor for feature detection
 */
class FeatureDetector {
  constructor(private features: DetectedFeatures) {}

  visit(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.MethodDeclaration: {
        const func = node as ts.FunctionLikeDeclaration;
        if (func.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
          this.features.hasAsync = true;
        }
        if (func.asteriskToken) {
          this.features.hasGenerators = true;
        }
        break;
      }

      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.ClassExpression: {
        const classNode = node as ts.ClassLikeDeclaration;
        const decorators = ts.getDecorators?.(classNode) || [];
        if (decorators.length > 0) {
          this.features.hasDecorators = true;
        }
        // Check for private fields
        classNode.members.forEach((member) => {
          if (member.name && ts.isPrivateIdentifier(member.name)) {
            this.features.hasPrivateFields = true;
          }
          // Check for decorators on members that support them
          if (ts.canHaveDecorators(member)) {
            const memberDecorators = ts.getDecorators?.(member as any) || [];
            if (memberDecorators.length > 0) {
              this.features.hasDecorators = true;
            }
          }
        });
        break;
      }

      case ts.SyntaxKind.AwaitExpression:
        this.features.hasAsync = true;
        break;

      case ts.SyntaxKind.YieldExpression:
        this.features.hasGenerators = true;
        break;

      case ts.SyntaxKind.BigIntLiteral:
        this.features.hasBigInt = true;
        break;

      case ts.SyntaxKind.PropertyAccessExpression:
      case ts.SyntaxKind.ElementAccessExpression: {
        const expr = node as ts.PropertyAccessExpression | ts.ElementAccessExpression;
        if (expr.questionDotToken) {
          this.features.hasOptionalChaining = true;
        }
        break;
      }

      case ts.SyntaxKind.BinaryExpression: {
        const binary = node as ts.BinaryExpression;
        if (binary.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
          this.features.hasNullishCoalescing = true;
        }
        break;
      }

      case ts.SyntaxKind.TemplateExpression:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        this.features.hasTemplateLiterals = true;
        break;

      case ts.SyntaxKind.ImportDeclaration: {
        const importDecl = node as ts.ImportDeclaration;
        // Check if it's a dynamic import
        if (importDecl.moduleSpecifier.parent?.kind === ts.SyntaxKind.CallExpression) {
          this.features.hasDynamicImports = true;
        }
        break;
      }

      case ts.SyntaxKind.CallExpression: {
        const call = node as ts.CallExpression;
        // Check for optional chaining
        if (call.questionDotToken) {
          this.features.hasOptionalChaining = true;
        }
        // Check for dynamic import()
        if (call.expression.kind === ts.SyntaxKind.ImportKeyword) {
          this.features.hasDynamicImports = true;
        }
        break;
      }

      case ts.SyntaxKind.AsExpression: {
        const asExpr = node as ts.AsExpression;
        // Check for const assertions
        if (asExpr.type.kind === ts.SyntaxKind.TypeReference) {
          const typeRef = asExpr.type as ts.TypeReferenceNode;
          if (ts.isIdentifier(typeRef.typeName) && typeRef.typeName.text === "const") {
            this.features.hasConstAssertions = true;
          }
        }
        break;
      }

      case ts.SyntaxKind.SatisfiesExpression:
        this.features.typeScriptFeatures.satisfies = true;
        break;

      case ts.SyntaxKind.ConditionalType:
        this.features.typeScriptFeatures.conditionalTypes = true;
        break;

      case ts.SyntaxKind.MappedType:
        this.features.typeScriptFeatures.mappedTypes = true;
        break;

      case ts.SyntaxKind.TemplateLiteralType:
        this.features.typeScriptFeatures.templateLiteralTypes = true;
        break;

      case ts.SyntaxKind.TypeParameter: {
        const typeParam = node as ts.TypeParameterDeclaration;
        if (typeParam.modifiers?.some((m) => m.kind === ts.SyntaxKind.ConstKeyword)) {
          this.features.typeScriptFeatures.constTypeParams = true;
        }
        break;
      }

      case ts.SyntaxKind.JsxElement:
      case ts.SyntaxKind.JsxSelfClosingElement:
      case ts.SyntaxKind.JsxFragment:
        this.features.hasJSX = true;
        break;
    }

    // Visit children
    ts.forEachChild(node, (child) => this.visit(child));
  }
}

/**
 * Get diagnostic location from TypeScript diagnostic
 */
function getDiagnosticLocation(
  diagnostic: ts.Diagnostic,
  sourceFile: ts.SourceFile,
): SourceLocation | undefined {
  if (diagnostic.start === undefined) {
    return undefined;
  }

  const start = sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
  const end = diagnostic.length
    ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length)
    : undefined;

  return {
    file: sourceFile.fileName,
    line: start.line + 1,
    column: start.character + 1,
    endLine: end ? end.line + 1 : undefined,
    endColumn: end ? end.character + 1 : undefined,
  };
}

/**
 * Convert TypeScript position to our SourceLocation
 */
export function nodeToLocation(node: ts.Node): SourceLocation {
  const sourceFile = node.getSourceFile();
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  return {
    file: sourceFile.fileName,
    line: start.line + 1,
    column: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
  };
}

/**
 * Export TypeScript for use in other modules
 */
export { ts };
