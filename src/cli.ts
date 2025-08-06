#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * TypeScript to C++20 Transpiler CLI
 *
 * Command-line interface for the typescript2cxx transpiler. This tool converts
 * TypeScript source files into C++20 code with smart memory management.
 *
 * ## Installation
 *
 * ```bash
 * deno install -Arf -n tsc2cxx jsr:@wowemulation-dev/typescript2cxx/cli
 * ```
 *
 * ## Usage
 *
 * ```bash
 * # Transpile a single file
 * tsc2cxx input.ts -o output/
 *
 * # Watch mode for directory
 * tsc2cxx src/ -o build/ --watch
 *
 * # With plugins
 * tsc2cxx input.ts --plugin ./my-plugin.ts
 * ```
 *
 * ## Options
 *
 * - `-o, --output` - Output directory for generated files
 * - `-w, --watch` - Watch for file changes
 * - `--std` - C++ standard version (c++17, c++20, c++23)
 * - `--memory` - Memory management strategy
 * - `--plugin` - Load transpiler plugins
 *
 * @module typescript2cxx/cli
 */

import { parseArgs } from "jsr:@std/cli@1/parse-args";
import { compile } from "./compiler.ts";
import { VERSION } from "./mod.ts";

interface CliArgs {
  help: boolean;
  version: boolean;
  output?: string;
  watch?: boolean;
  build?: boolean;
  debug?: boolean;
  verbose?: boolean;
  "dry-run"?: boolean;
  std?: string;
  readable?: string;
  optimization?: string;
  memory?: string;
  runtime?: string;
  plugin?: string | string[];
  compiler?: string;
  include?: string | string[];
  lib?: string | string[];
  _: string[];
}

function printHelp() {
  console.log(`
TypeScript to C++20 Transpiler v${VERSION}

Usage: typescript2cxx [options] <input.ts>

Options:
  -h, --help          Show this help message
  -v, --version       Show version information
  -o, --output <dir>  Output directory (default: .)
  -w, --watch         Watch mode for automatic recompilation
  -b, --build         Build executable after transpilation
  -g, --debug         Generate debug information
  --verbose           Verbose output
  --dry-run           Show what would be done without doing it

Transpilation Options:
  --std <standard>    C++ standard: c++17, c++20, c++23 (default: c++20)
  --readable <mode>   Code readability: default, debug, minimal, false
  --optimization <O>  Optimization level: O0, O1, O2, O3, Os (default: O2)
  --memory <strategy> Memory strategy: auto, shared, unique, manual (default: auto)
  --runtime <path>    Runtime include path (default: runtime/core.h)
  --plugin <name>     Load plugin (can be specified multiple times)

Compilation Options:
  --compiler <name>   C++ compiler: clang++, g++, msvc, auto (default: auto)
  -I, --include <dir> Add include directory (can be specified multiple times)
  -l, --lib <name>    Link library (can be specified multiple times)

Examples:
  typescript2cxx input.ts
  typescript2cxx -o build/ -b input.ts
  typescript2cxx --std=c++23 --memory=unique input.ts
  typescript2cxx --plugin=game-engine -b game.ts
`);
}

function printVersion() {
  console.log(`typescript2cxx v${VERSION}`);
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "version", "watch", "build", "debug", "verbose", "dry-run"],
    string: [
      "output",
      "std",
      "readable",
      "optimization",
      "memory",
      "plugin",
      "compiler",
      "include",
      "lib",
    ],
    collect: ["plugin", "include", "lib"],
    alias: {
      h: "help",
      v: "version",
      o: "output",
      w: "watch",
      b: "build",
      g: "debug",
      I: "include",
      l: "lib",
    },
  }) as CliArgs;

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  if (args.version) {
    printVersion();
    Deno.exit(0);
  }

  const inputFile = args._[0];
  if (!inputFile) {
    console.error("Error: No input file specified");
    console.error("Use --help for usage information");
    Deno.exit(1);
  }

  // Build options from command line arguments
  const options = {
    outputDir: args.output ?? ".",
    buildExecutable: args.build ?? false,
    debug: args.debug ?? false,
    verbose: args.verbose ?? false,
    dryRun: args["dry-run"] ?? false,
    standard: args.std as any ?? "c++20",
    readability: args.readable as any ?? "default",
    optimization: args.optimization as any ?? "O2",
    memoryStrategy: args.memory as any ?? "auto",
    runtimeInclude: args.runtime as string,
    plugins: Array.isArray(args.plugin) ? args.plugin : (args.plugin ? [args.plugin] : []),
    compiler: args.compiler as any ?? "auto",
    includePaths: Array.isArray(args.include) ? args.include : (args.include ? [args.include] : []),
    libraries: Array.isArray(args.lib) ? args.lib : (args.lib ? [args.lib] : []),
  };

  try {
    if (args.watch) {
      // Watch mode
      console.log(`Watching ${inputFile} for changes...`);

      const watcher = Deno.watchFs([inputFile]);

      // Initial compilation
      await compileFile(inputFile, options);

      // Watch for changes
      for await (const event of watcher) {
        if (event.kind === "modify") {
          console.log(`\nFile changed, recompiling...`);
          await compileFile(inputFile, options);
        }
      }
    } else {
      // Single compilation
      await compileFile(inputFile, options);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}

// Compile file function
async function compileFile(filePath: string, options: any): Promise<void> {
  try {
    console.log(`Transpiling ${filePath}...`);

    const result = await compile(filePath, options);

    if (result.success) {
      console.log(`✓ Generated ${result.headerPath}`);
      console.log(`✓ Generated ${result.sourcePath}`);

      if (result.executablePath) {
        console.log(`✓ Built ${result.executablePath}`);
      }
    } else {
      console.error("✗ Compilation failed");
      if (result.output) {
        console.error(result.output);
      }
    }
  } catch (error) {
    console.error(
      "✗ Transpilation failed:",
      error instanceof Error ? error.message : String(error),
    );
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  });
}
