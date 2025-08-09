/**
 * Main transpiler module
 */

import { parseTypeScript, parseTypeScriptFile as _parseTypeScriptFile } from "./ast/parser.ts";
import { ErrorReporter, TranspilerError } from "./errors.ts";
import type {
  CompilerContext,
  TranspileOptions,
  TranspileResult,
  TranspilerWarning as _TranspilerWarning,
  TranspileStats,
} from "./types.ts";

// These will be implemented as we build out the transpiler
import { transformToIR } from "./transform/transformer.ts";
import { generateCpp } from "./codegen/generator.ts";
import { analyzeMemory } from "./memory/analyzer.ts";
import { loadPlugins } from "./plugins/loader.ts";

/**
 * Transpile TypeScript code to C++
 */
export async function transpile(
  source: string,
  options: TranspileOptions = {},
): Promise<TranspileResult> {
  const startTime = performance.now();
  const errorReporter = new ErrorReporter();

  // Initialize stats
  const stats: TranspileStats = {
    nodesProcessed: 0,
    linesGenerated: 0,
    timeMs: 0,
    typesResolved: 0,
    optimizationsApplied: 0,
  };

  try {
    // Load plugins
    const plugins = await loadPlugins(options.plugins ?? []);

    // Create compiler context
    const context: CompilerContext = {
      options: normalizeOptions(options),
      typeChecker: createTypeChecker(),
      currentFile: options.filename,
      warnings: [],
      stats,
      pluginContexts: new Map(),
      originalSource: source, // Add original source for source maps
    } as any;

    // Initialize plugins
    for (const plugin of plugins) {
      if (plugin.onInit) {
        await plugin.onInit(createPluginContext(plugin, context));
      }
    }

    // Parse TypeScript with type checking enabled
    const parseResult = parseTypeScript(source, {
      filename: options.filename ?? "<anonymous>",
      tsx: options.tsx ?? false,
      decorators: true,
      dynamicImport: true,
      typeCheck: true,
      typeCheckOptions: {
        typeMappings: options.typeMappings,
      },
    });

    // Check for type errors
    if (parseResult.typeCheckResult?.hasErrors) {
      const firstError = parseResult.typeCheckResult.errors[0];
      throw new TranspilerError(
        `Type error: ${firstError.message}`,
        "TYPE_ERROR",
        firstError.location,
      );
    }

    // Run pre-transform plugins
    for (const plugin of plugins) {
      if (plugin.onBeforeTransform) {
        await plugin.onBeforeTransform(parseResult.ast, createPluginContext(plugin, context));
      }
    }

    // Transform to IR with type checker
    const ir = transformToIR(parseResult.ast, {
      context,
      plugins,
      errorReporter,
      outputName: options.outputName,
      source,
      filename: options.filename,
      typeChecker: parseResult.typeChecker,
    });

    stats.nodesProcessed = countIRNodes(ir);

    // Analyze memory management
    if (options.memoryStrategy !== "manual") {
      const memoryResults = await analyzeMemory(ir, {
        strategy: options.memoryStrategy ?? "auto",
        options,
      });

      // Apply memory analysis results
      applyMemoryAnalysis(ir, memoryResults);
    }

    // Generate C++ code
    const generated = await generateCpp(ir, {
      options: context.options,
      context,
      plugins,
      errorReporter,
    });

    stats.linesGenerated = countLines(generated.header) + countLines(generated.source);

    // Run post-transform plugins
    let finalSource = generated.source;
    for (const plugin of plugins) {
      if (plugin.onAfterTransform) {
        finalSource = await plugin.onAfterTransform(
          finalSource,
          createPluginContext(plugin, context),
        );
      }
    }

    // Complete plugins
    for (const plugin of plugins) {
      if (plugin.onComplete) {
        await plugin.onComplete(createPluginContext(plugin, context));
      }
    }

    stats.timeMs = performance.now() - startTime;

    return {
      header: generated.header,
      source: finalSource,
      sourceMap: generated.sourceMap,
      warnings: context.warnings,
      stats,
    };
  } catch (error) {
    if (error instanceof TranspilerError) {
      throw error;
    }
    console.error("Transpiler error:", error);
    throw new TranspilerError(
      error instanceof Error ? error.message : String(error),
      "INTERNAL_ERROR",
    );
  }
}

/**
 * Transpile TypeScript file to C++
 */
export async function transpileFile(
  filePath: string,
  options: TranspileOptions = {},
): Promise<TranspileResult> {
  const source = await Deno.readTextFile(filePath);
  return transpile(source, {
    ...options,
    filename: filePath,
  });
}

/**
 * Normalize transpile options
 */
function normalizeOptions(options: TranspileOptions): TranspileOptions {
  return {
    filename: options.filename, // Preserve filename for source maps
    outputName: options.outputName, // Preserve output name
    tsx: options.tsx, // Preserve TSX flag
    standard: options.standard ?? "c++20",
    sourceMap: options.sourceMap ?? false,
    readability: options.readability ?? "default",
    optimization: options.optimization ?? "O2",
    memoryStrategy: options.memoryStrategy ?? "auto",
    plugins: options.plugins ?? [],
    includePaths: options.includePaths ?? [],
    typeMappings: options.typeMappings ?? {},
    platform: options.platform ?? "generic",
    useCoroutines: options.useCoroutines ?? true,
    useModules: options.useModules ?? false,
    generateReflection: options.generateReflection ?? false,
    runtimeInclude: options.runtimeInclude ?? "core.h",
  };
}

/**
 * Create a minimal type checker
 * TODO: Implement full type checking with TypeScript compiler API
 */
function createTypeChecker(): any {
  return {
    resolveType: (_node: unknown) => ({
      name: "unknown",
      cppType: "std::any",
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
    }),
    getSymbol: (_node: unknown) => undefined,
    isAssignableTo: (_source: unknown, _target: unknown) => true,
  };
}

/**
 * Create plugin context
 */
function createPluginContext(plugin: any, context: CompilerContext): any {
  const storage = context.pluginContexts.get(plugin.name) ?? new Map();
  context.pluginContexts.set(plugin.name, storage);

  return {
    pluginName: plugin.name,
    config: plugin.defaultConfig ?? {},
    transpiler: {
      addTypeMapping: (from: string, to: string) => {
        context.options.typeMappings![from] = to;
      },
      addTransformer: () => {
        // TODO: Implement dynamic transformer addition
      },
      addEmitter: () => {
        // TODO: Implement dynamic emitter addition
      },
      getIR: () => {
        // TODO: Return current IR tree
        return null;
      },
      emit: {
        addInclude: (_header: string) => {
          // TODO: Track includes
        },
        addHelper: (_name: string, _code: string) => {
          // TODO: Track helpers
        },
        addForwardDeclaration: (_declaration: string) => {
          // TODO: Track forward declarations
        },
      },
    },
    logger: {
      debug: (message: string) => console.debug(`[${plugin.name}] ${message}`),
      info: (message: string) => console.info(`[${plugin.name}] ${message}`),
      warn: (message: string) => {
        console.warn(`[${plugin.name}] ${message}`);
        context.warnings.push({
          code: "PLUGIN_WARNING",
          message: `${plugin.name}: ${message}`,
          severity: "warning",
        });
      },
      error: (message: string) => console.error(`[${plugin.name}] ${message}`),
    },
    options: context.options,
    storage,
  };
}

/**
 * Count IR nodes for statistics
 */
function countIRNodes(node: any): number {
  let count = 1;

  // Count child nodes recursively
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object" && "kind" in item) {
            count += countIRNodes(item);
          }
        }
      } else if ("kind" in value) {
        count += countIRNodes(value);
      }
    }
  }

  return count;
}

/**
 * Count lines in generated code
 */
function countLines(code: string): number {
  return code.split("\n").length;
}

/**
 * Apply memory analysis results to IR
 */
function applyMemoryAnalysis(_ir: any, _results: any): void {
  // TODO: Apply memory analysis results to IR nodes
  // This would modify pointer types based on analysis
}
