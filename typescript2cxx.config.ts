/**
 * TypeScript2Cxx Configuration File
 *
 * This file configures the transpiler behavior and loaded plugins.
 * It can be a .ts, .js, or .json file.
 */

import type { TranspilerConfig } from "./src/config/types.ts";
import { gameEnginePlugin } from "./examples/plugins/game-engine-plugin.ts";

const config: TranspilerConfig = {
  // Extends another configuration
  extends: "@typescript2cxx/preset-modern",

  // C++ target configuration
  target: {
    standard: "c++20",
    compiler: "clang++",
    stdlib: "libc++",
    platform: "cross-platform",
  },

  // Memory management strategy
  memory: {
    model: "shared_ptr", // "raw" | "shared_ptr" | "unique_ptr" | "custom"
    customAllocator: "engine::MemoryPool",
    trackAllocations: true,
  },

  // Code emission settings
  emit: {
    style: "google", // "google" | "llvm" | "mozilla" | "custom"
    headerExtension: ".hpp",
    sourceExtension: ".cpp",
    headerGuardStyle: "pragma", // "pragma" | "ifndef"
    generateSourceMaps: true,
    separateHeaders: true,

    // Output directory structure
    outputStructure: {
      headers: "include/",
      sources: "src/",
      generatedFirst: true, // Put generated code before user code
    },
  },

  // Type mapping configuration
  types: {
    // Default type mappings
    defaults: {
      numberType: "double", // or "float", "long double"
      stringType: "std::string", // or "std::string_view"
      arrayContainer: "std::vector", // or "std::array", "boost::array"
      mapContainer: "std::unordered_map", // or "std::map"
      optionalType: "std::optional", // or "boost::optional"
    },

    // Custom type mappings
    mappings: {
      // Built-in overrides
      "bigint": "cpp::int128_t",
      "symbol": "cpp::symbol",

      // Domain types
      "UUID": "boost::uuids::uuid",
      "DateTime": "std::chrono::system_clock::time_point",
      "Duration": "std::chrono::milliseconds",

      // Library types
      "Observable": "rxcpp::observable",
      "Subject": "rxcpp::subject",
    },
  },

  // Runtime library configuration
  runtime: {
    // Include paths for runtime headers
    includes: [
      "<typescript2cxx/runtime.hpp>",
      "<typescript2cxx/types.hpp>",
    ],

    // Link against runtime library
    library: "typescript2cxx-runtime",

    // Runtime feature flags
    features: {
      exceptions: true,
      rtti: true,
      threads: true,
      coroutines: true,
    },
  },

  // Plugin configuration
  plugins: [
    // Built-in plugins
    "@typescript2cxx/plugin-stl",
    "@typescript2cxx/plugin-boost",

    // Custom plugins
    gameEnginePlugin,

    // Plugin with configuration
    {
      plugin: "@typescript2cxx/plugin-qt",
      options: {
        version: "6",
        modules: ["Core", "Gui", "Widgets"],
      },
    },
  ],

  // Compilation options
  compilation: {
    // TypeScript parsing options
    parsing: {
      strict: true,
      allowJs: false,
      checkJs: false,
      resolveJsonModule: true,
    },

    // Optimization settings
    optimization: {
      level: "O2", // "O0" | "O1" | "O2" | "O3" | "Os"
      inlineSimpleFunctions: true,
      eliminateDeadCode: true,
      mergeStrings: true,
    },

    // Warning settings
    warnings: {
      unusedVariables: "error", // "ignore" | "warning" | "error"
      implicitAny: "error",
      possibleNullDereference: "warning",
      inefficientContainerUsage: "warning",
    },
  },

  // Transformer pipeline configuration
  transformers: {
    // Pre-transform phase
    pre: [
      "@typescript2cxx/transformer-decorators",
      "@typescript2cxx/transformer-jsx",
    ],

    // Main transform phase
    main: [
      // Transformers run in order
    ],

    // Post-transform phase
    post: [
      "@typescript2cxx/transformer-optimize",
      "@typescript2cxx/transformer-format",
    ],
  },

  // Development settings
  development: {
    // Watch mode configuration
    watch: {
      enable: true,
      debounce: 300,
      clearConsole: true,
    },

    // Debugging options
    debug: {
      logLevel: "info", // "debug" | "info" | "warning" | "error"
      dumpAST: false,
      dumpIR: false,
      tracePipeline: false,
    },

    // Error handling
    errors: {
      format: "pretty", // "pretty" | "plain" | "json"
      showCodeFrames: true,
      showSuggestions: true,
      maxErrors: 100,
    },
  },

  // Project-specific settings
  project: {
    // Source file patterns
    include: [
      "src/**/*.ts",
      "lib/**/*.ts",
    ],

    exclude: [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/node_modules/**",
    ],

    // Entry points
    entry: {
      main: "src/main.ts",
      lib: "src/index.ts",
    },

    // Output configuration
    output: {
      directory: "dist",
      clean: true,
      preserveStructure: true,
    },
  },

  // Integration settings
  integration: {
    // Build system integration
    cmake: {
      generate: true,
      projectName: "MyProject",
      minimumVersion: "3.20",
      findPackages: ["Boost", "Threads"],
    },

    // Package manager integration
    conan: {
      generate: true,
      requires: [
        "boost/1.82.0",
        "fmt/10.0.0",
      ],
    },

    // IDE integration
    ide: {
      generateCompileCommands: true,
      generateVSCode: true,
      generateCLion: true,
    },
  },

  // Validation rules
  validation: {
    // Type safety rules
    strictNullChecks: true,
    noImplicitAny: true,
    noImplicitThis: true,

    // C++ specific validations
    checkMemoryLeaks: true,
    checkCircularDependencies: true,
    enforceRAII: true,

    // Custom validation plugins
    custom: [
      "./validation/no-raw-pointers.ts",
      "./validation/naming-conventions.ts",
    ],
  },

  // Experimental features
  experimental: {
    // Enable experimental TypeScript features
    decorators: true,
    decoratorMetadata: true,

    // C++ experimental features
    modules: false, // C++20 modules
    contracts: false, // C++23 contracts
    reflection: false, // C++ reflection TS

    // Transpiler experimental features
    parallelCompilation: true,
    incrementalCompilation: true,
    hotReload: false,
  },
};

export default config;
