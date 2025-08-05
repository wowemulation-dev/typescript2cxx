/**
 * TypeScript AST parser using swc
 */

// NOTE: Using deno.land/x import for swc as npm version requires native bindings
// This prevents JSR publishing but is necessary for the parser to work correctly
import { parse } from "https://deno.land/x/swc@0.2.1/mod.ts";
import { ParseError } from "../errors.ts";
import type { SourceLocation } from "../types.ts";

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
}

/**
 * Parse result
 */
export interface ParseResult {
  /** Parsed AST */
  ast: any; // swc AST

  /** Source file */
  filename: string;

  /** Parse time in ms */
  parseTime: number;

  /** Detected features */
  features: DetectedFeatures;
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
 * Parse TypeScript source code
 */
export async function parseTypeScript(
  source: string,
  options: ParseOptions = {},
): Promise<ParseResult> {
  const startTime = performance.now();

  try {
    // Parse with swc
    const ast = await parse(source, {
      syntax: "typescript",
      tsx: options.tsx ?? false,
      decorators: options.decorators ?? true,
      dynamicImport: options.dynamicImport ?? true,
      target: options.target ?? "es2022",
      // preserveAllComments: true, // Not supported in this swc version
    } as any);

    // Detect features
    const features = detectFeatures(ast);

    const parseTime = performance.now() - startTime;

    return {
      ast,
      filename: options.filename ?? "<anonymous>",
      parseTime,
      features,
    };
  } catch (error) {
    // Convert swc error to our error type
    const location = extractErrorLocation(error);
    throw new ParseError(
      error instanceof Error ? error.message : String(error),
      location,
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
    return await parseTypeScript(source, {
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
function detectFeatures(ast: any): DetectedFeatures {
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
  visitor.visitModule(ast);

  return features;
}

/**
 * AST visitor for feature detection
 */
class FeatureDetector {
  constructor(private features: DetectedFeatures) {}

  visitModule(module: any): void {
    if (module.body) {
      for (const item of module.body) {
        this.visitModuleItem(item);
      }
    }
  }

  visitModuleItem(item: any): void {
    switch (item.type) {
      case "FunctionDeclaration":
        if (item.async) this.features.hasAsync = true;
        if (item.generator) this.features.hasGenerators = true;
        this.visitFunctionBody(item.body);
        break;

      case "ClassDeclaration":
        if (item.decorators?.length > 0) {
          this.features.hasDecorators = true;
        }
        this.visitClass(item);
        break;

      case "ImportDeclaration":
        if (item.source.type === "CallExpression") {
          this.features.hasDynamicImports = true;
        }
        break;

      case "ExportDeclaration":
        if (item.declaration) {
          this.visitModuleItem(item.declaration);
        }
        break;

      case "VariableDeclaration":
        for (const decl of item.declarations) {
          if (decl.init) {
            this.visitExpression(decl.init);
          }
        }
        break;

      case "ExpressionStatement":
        this.visitExpression(item.expression);
        break;
    }
  }

  visitClass(classNode: any): void {
    for (const member of classNode.body) {
      if (member.type === "PrivateProperty") {
        this.features.hasPrivateFields = true;
      }

      if (member.decorators?.length > 0) {
        this.features.hasDecorators = true;
      }

      if (member.value?.type === "FunctionExpression") {
        if (member.value.async) this.features.hasAsync = true;
        if (member.value.generator) this.features.hasGenerators = true;
        this.visitFunctionBody(member.value.body);
      }
    }
  }

  visitFunctionBody(body: any): void {
    if (!body) return;

    for (const stmt of body.stmts || []) {
      this.visitStatement(stmt);
    }
  }

  visitStatement(stmt: any): void {
    switch (stmt.type) {
      case "ExpressionStatement":
        this.visitExpression(stmt.expression);
        break;

      case "ReturnStatement":
        if (stmt.argument) {
          this.visitExpression(stmt.argument);
        }
        break;

      case "IfStatement":
        this.visitExpression(stmt.test);
        this.visitStatement(stmt.consequent);
        if (stmt.alternate) {
          this.visitStatement(stmt.alternate);
        }
        break;

      case "ForStatement":
      case "WhileStatement":
      case "DoWhileStatement":
        if (stmt.test) this.visitExpression(stmt.test);
        if (stmt.body) this.visitStatement(stmt.body);
        break;

      case "BlockStatement":
        for (const s of stmt.stmts) {
          this.visitStatement(s);
        }
        break;
    }
  }

  visitExpression(expr: any): void {
    if (!expr) return;

    switch (expr.type) {
      case "AwaitExpression":
        this.features.hasAsync = true;
        this.visitExpression(expr.argument);
        break;

      case "YieldExpression":
        this.features.hasGenerators = true;
        if (expr.argument) {
          this.visitExpression(expr.argument);
        }
        break;

      case "BigIntLiteral":
        this.features.hasBigInt = true;
        break;

      case "OptionalMemberExpression":
      case "OptionalCallExpression":
      case "OptionalChainingExpression":
        this.features.hasOptionalChaining = true;
        if (expr.base) {
          this.visitExpression(expr.base);
        }
        break;

      case "MemberExpression":
        if (expr.optional) {
          this.features.hasOptionalChaining = true;
        }
        this.visitExpression(expr.object);
        this.visitExpression(expr.property);
        break;

      case "CallExpression":
        if (expr.optional) {
          this.features.hasOptionalChaining = true;
        }
        this.visitExpression(expr.callee);
        for (const arg of expr.arguments) {
          this.visitExpression(arg.expression);
        }
        break;

      case "BinaryExpression":
        if (expr.operator === "??") {
          this.features.hasNullishCoalescing = true;
        }
        this.visitExpression(expr.left);
        this.visitExpression(expr.right);
        break;

      case "TemplateLiteral":
        this.features.hasTemplateLiterals = true;
        break;

      case "TsConstAssertion":
        this.features.hasConstAssertions = true;
        break;

      case "TsSatisfiesExpression":
        this.features.typeScriptFeatures.satisfies = true;
        break;

      case "TsConditionalType":
        this.features.typeScriptFeatures.conditionalTypes = true;
        break;

      case "TsMappedType":
        this.features.typeScriptFeatures.mappedTypes = true;
        break;

      case "ArrayExpression":
        for (const elem of expr.elements) {
          if (elem?.expression) {
            this.visitExpression(elem.expression);
          }
        }
        break;

      case "ObjectExpression":
        for (const prop of expr.properties) {
          if (prop.type === "KeyValueProperty") {
            this.visitExpression(prop.value);
          }
        }
        break;
    }
  }
}

/**
 * Extract error location from swc error
 */
function extractErrorLocation(error: unknown): SourceLocation | undefined {
  if (error && typeof error === "object" && "span" in error) {
    const span = (error as any).span;
    return {
      file: "<anonymous>",
      line: span.start.line ?? 1,
      column: span.start.column ?? 1,
      endLine: span.end?.line,
      endColumn: span.end?.column,
    };
  }
  return undefined;
}

/**
 * Convert swc span to our SourceLocation
 */
export function spanToLocation(span: any, filename: string): SourceLocation {
  return {
    file: filename,
    line: span.start.line ?? 1,
    column: span.start.column ?? 1,
    endLine: span.end?.line,
    endColumn: span.end?.column,
  };
}
