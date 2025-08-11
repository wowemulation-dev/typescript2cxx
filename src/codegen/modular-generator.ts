/**
 * Modular C++ code generator - refactored from monolithic generator
 */

import { createSourceMap } from "../sourcemap/generator.ts";
import type { CompilerContext } from "../types.ts";
import type { Plugin } from "../plugins/types.ts";
import type { ErrorReporter } from "../errors.ts";
import type { TranspileOptions } from "../types.ts";
import type {
  IRModule,
  IRProgram,
  IRStatement,
} from "../ir/nodes.ts";
import { MemoryManagement } from "../ir/nodes.ts";

// Import modular generators
import { StatementGenerator } from "./generators/statement-generator.ts";
import { ExpressionGenerator } from "./generators/expression-generator.ts";
import { DeclarationGenerator } from "./generators/declaration-generator.ts";
import { TypeMapper } from "./generators/type-mapper.ts";
import type { CodeGenContext } from "./context.ts";

/**
 * Generation options
 */
export interface GenerateOptions {
  /** Transpiler options */
  options: TranspileOptions;

  /** Compiler context */
  context: CompilerContext;

  /** Active plugins */
  plugins: Plugin[];

  /** Error reporter */
  errorReporter: ErrorReporter;
}

/**
 * Generation result
 */
export interface GenerateResult {
  /** Generated header file content */
  header: string;

  /** Generated source file content */
  source: string;

  /** Source map (if enabled) */
  sourceMap?: string;
}

/**
 * Context for header/source generation
 */
interface GenerationContext {
  header: string[];
  source: string[];
  requiredIncludes: Set<string>;
  forwardDeclarations: Set<string>;
  sourceMapData?: { mappings: string; sources: string[]; names: string[] };
}

/**
 * Modular C++ code generator using specialized generator classes
 */
class ModularCppGenerator {
  private readonly typeMapper: TypeMapper;
  private readonly expressionGen: ExpressionGenerator;
  private readonly declarationGen: DeclarationGenerator;
  private readonly statementGen: StatementGenerator;

  constructor(private options: GenerateOptions) {
    this.typeMapper = new TypeMapper();
    this.expressionGen = new ExpressionGenerator(this.typeMapper);
    this.declarationGen = new DeclarationGenerator(this.expressionGen, this.typeMapper);
    this.statementGen = new StatementGenerator(this.expressionGen, this.declarationGen);
    
    // Inject statement generator to resolve circular dependency
    this.expressionGen.setStatementGenerator((stmt: any, ctx: CodeGenContext) =>
      this.statementGen.generateStatement(stmt, ctx)
    );
  }

  generate(ir: IRProgram): GenerateResult {
    // Create source map generator if enabled
    const sourceMapGenerator = this.options.options.sourceMap
      ? createSourceMap(this.options.options.sourceMap)
      : undefined;

    // Single module for now
    const module = ir.modules[0];
    if (!module) {
      throw new Error("No module found in IR");
    }

    return this.generateModule(module, ir);
  }

  private generateModule(module: IRModule, program: IRProgram): GenerateResult {
    const context: GenerationContext = {
      header: [],
      source: [],
      requiredIncludes: new Set([
        "iostream",
        "string", 
        "vector",
        "memory",
        "functional",
        "any",
        "optional",
        "variant",
        "unordered_map"
      ]),
      forwardDeclarations: new Set(),
      sourceMapData: undefined,
    };

    // Add runtime include based on options
    const runtimePath = this.options.options.runtime || "runtime/core.h";
    context.requiredIncludes.add(`"${runtimePath}"`);

    // Generate header and source
    this.generateModuleHeader(module, context);
    this.generateModuleSource(module, context);

    // Build final files
    const header = this.buildHeaderFile(context);
    const source = this.buildSourceFile(context);

    const result: GenerateResult = {
      header,
      source,
    };

    // Add source map if enabled
    if (context.sourceMapData) {
      result.sourceMap = JSON.stringify(context.sourceMapData);
    }

    return result;
  }

  private generateModuleHeader(module: IRModule, context: GenerationContext): void {
    const codeGenContext: CodeGenContext = {
      indentLevel: 0,
      inHeader: true,
      requiredIncludes: context.requiredIncludes,
      forwardDeclarations: context.forwardDeclarations,
      errorReporter: this.options.errorReporter,
      statementGenerator: this.statementGen,
      typeMapper: this.typeMapper,
    };

    // Header guard
    const guardName = `${module.name.toUpperCase()}_H`;
    context.header.push(`#ifndef ${guardName}`);
    context.header.push(`#define ${guardName}`);
    context.header.push("");

    // Generate forward declarations and header content
    for (const stmt of module.body) {
      if (this.shouldIncludeInHeader(stmt)) {
        const code = this.statementGen.generateStatement(stmt, codeGenContext);
        if (code) {
          context.header.push(code);
          context.header.push("");
        }
      }
    }

    context.header.push(`#endif // ${guardName}`);
  }

  private generateModuleSource(module: IRModule, context: GenerationContext): void {
    const codeGenContext: CodeGenContext = {
      indentLevel: 0,
      inHeader: false,
      requiredIncludes: context.requiredIncludes,
      forwardDeclarations: context.forwardDeclarations,
      errorReporter: this.options.errorReporter,
      statementGenerator: this.statementGen,
      typeMapper: this.typeMapper,
    };

    // Include the header file
    context.source.push(`#include "${module.name}.h"`);
    context.source.push("");

    // Generate source content
    for (const stmt of module.body) {
      const code = this.statementGen.generateStatement(stmt, codeGenContext);
      if (code) {
        context.source.push(code);
        context.source.push("");
      }
    }

    // Add main function if needed
    if (this.hasMainFunction(module)) {
      context.source.push("int main() {");
      context.source.push("  try {");
      context.source.push("    main_();");
      context.source.push("  } catch (const std::exception& e) {");
      context.source.push('    std::cerr << "Error: " << e.what() << std::endl;');
      context.source.push("    return 1;");
      context.source.push("  }");
      context.source.push("  return 0;");
      context.source.push("}");
    }
  }

  private shouldIncludeInHeader(stmt: IRStatement): boolean {
    // Only declarations go in header
    return this.isDeclaration(stmt);
  }

  private isDeclaration(stmt: IRStatement): boolean {
    const declarationKinds = new Set([
      "VariableDeclaration",
      "FunctionDeclaration", 
      "ClassDeclaration",
      "InterfaceDeclaration",
      "EnumDeclaration",
      "TypeAliasDeclaration",
      "NamespaceDeclaration"
    ]);
    
    return declarationKinds.has(stmt.kind);
  }

  private hasMainFunction(module: IRModule): boolean {
    return module.body.some(stmt => 
      stmt.kind === "FunctionDeclaration" && 
      "name" in stmt && 
      stmt.name === "main"
    );
  }

  private buildHeaderFile(context: GenerationContext): string {
    const lines: string[] = [];

    // Standard includes
    const standardIncludes = Array.from(context.requiredIncludes)
      .filter(inc => !inc.startsWith('"'))
      .sort();
    
    if (standardIncludes.length > 0) {
      for (const inc of standardIncludes) {
        lines.push(`#include <${inc}>`);
      }
      lines.push("");
    }

    // Local includes  
    const localIncludes = Array.from(context.requiredIncludes)
      .filter(inc => inc.startsWith('"'))
      .sort();
    
    if (localIncludes.length > 0) {
      for (const inc of localIncludes) {
        lines.push(`#include ${inc}`);
      }
      lines.push("");
    }

    // Forward declarations
    if (context.forwardDeclarations.size > 0) {
      for (const decl of Array.from(context.forwardDeclarations).sort()) {
        lines.push(decl);
      }
      lines.push("");
    }

    // Header content
    lines.push(...context.header);

    return lines.join("\n");
  }

  private buildSourceFile(context: GenerationContext): string {
    const lines: string[] = [];

    // Standard includes (if not in header)
    const standardIncludes = Array.from(context.requiredIncludes)
      .filter(inc => !inc.startsWith('"') && !["iostream", "string", "vector", "memory"].includes(inc))
      .sort();
    
    if (standardIncludes.length > 0) {
      for (const inc of standardIncludes) {
        lines.push(`#include <${inc}>`);
      }
      lines.push("");
    }

    // Source content
    lines.push(...context.source);

    return lines.join("\n");
  }
}

/**
 * Generate C++ code from IR
 */
export function generate(ir: IRProgram, options: GenerateOptions): GenerateResult {
  const generator = new ModularCppGenerator(options);
  return generator.generate(ir);
}