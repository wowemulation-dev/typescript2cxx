/**
 * Configuration system type definitions
 */

export interface TranspilerConfig {
  // Inheritance support
  extends?: string | string[];

  // Target C++ configuration
  target?: TargetConfig;

  // Memory management
  memory?: MemoryConfig;

  // Code emission
  emit?: EmitConfig;

  // Type system configuration
  types?: TypeConfig;

  // Runtime configuration
  runtime?: RuntimeConfig;

  // Plugins
  plugins?: PluginReference[];

  // Compilation options
  compilation?: CompilationConfig;

  // Transformer pipeline
  transformers?: TransformerConfig;

  // Development settings
  development?: DevelopmentConfig;

  // Project settings
  project?: ProjectConfig;

  // Integration settings
  integration?: IntegrationConfig;

  // Validation settings
  validation?: ValidationConfig;

  // Experimental features
  experimental?: ExperimentalConfig;
}

export interface TargetConfig {
  standard: "c++11" | "c++14" | "c++17" | "c++20" | "c++23";
  compiler?: "gcc" | "clang++" | "msvc" | "icc";
  stdlib?: "libstdc++" | "libc++" | "msvc";
  platform?: "linux" | "windows" | "macos" | "cross-platform";
  architecture?: "x86" | "x64" | "arm" | "arm64";
}

export interface MemoryConfig {
  model: "raw" | "shared_ptr" | "unique_ptr" | "custom";
  customAllocator?: string;
  trackAllocations?: boolean;
  pooling?: {
    enable: boolean;
    initialSize: number;
    growthFactor: number;
  };
}

export interface EmitConfig {
  style: "google" | "llvm" | "mozilla" | "webkit" | "microsoft" | "custom";
  headerExtension: string;
  sourceExtension: string;
  headerGuardStyle: "pragma" | "ifndef";
  generateSourceMaps: boolean;
  separateHeaders: boolean;
  outputStructure: {
    headers: string;
    sources: string;
    generatedFirst: boolean;
  };
  formatting?: {
    indentWidth: number;
    columnLimit: number;
    bracesOnNewLine: boolean;
  };
}

export interface TypeConfig {
  defaults: {
    numberType: string;
    stringType: string;
    arrayContainer: string;
    mapContainer: string;
    optionalType: string;
  };
  mappings: Record<string, string>;
  imports?: Record<string, string[]>;
}

export interface RuntimeConfig {
  includes: string[];
  library?: string;
  features: {
    exceptions: boolean;
    rtti: boolean;
    threads: boolean;
    coroutines: boolean;
  };
  customRuntime?: string;
}

export type PluginReference = string | PluginWithOptions;

export interface PluginWithOptions {
  plugin: string;
  options: Record<string, unknown>;
}

export interface CompilationConfig {
  parsing: {
    strict: boolean;
    allowJs: boolean;
    checkJs: boolean;
    resolveJsonModule: boolean;
  };
  optimization: {
    level: "O0" | "O1" | "O2" | "O3" | "Os";
    inlineSimpleFunctions: boolean;
    eliminateDeadCode: boolean;
    mergeStrings: boolean;
  };
  warnings: Record<string, "ignore" | "warning" | "error">;
}

export interface TransformerConfig {
  pre?: string[];
  main?: string[];
  post?: string[];
}

export interface DevelopmentConfig {
  watch?: {
    enable: boolean;
    debounce: number;
    clearConsole: boolean;
  };
  debug?: {
    logLevel: "debug" | "info" | "warning" | "error";
    dumpAST: boolean;
    dumpIR: boolean;
    tracePipeline: boolean;
  };
  errors?: {
    format: "pretty" | "plain" | "json";
    showCodeFrames: boolean;
    showSuggestions: boolean;
    maxErrors: number;
  };
}

export interface ProjectConfig {
  include: string[];
  exclude: string[];
  entry: Record<string, string>;
  output: {
    directory: string;
    clean: boolean;
    preserveStructure: boolean;
  };
}

export interface IntegrationConfig {
  cmake?: CMakeConfig;
  vcpkg?: VcpkgConfig;
  conan?: ConanConfig;
  ide?: IDEConfig;
}

export interface CMakeConfig {
  generate: boolean;
  projectName: string;
  minimumVersion: string;
  findPackages: string[];
  customCommands?: string[];
}

export interface VcpkgConfig {
  generate: boolean;
  requires: string[];
  triplet?: string;
  features?: Record<string, boolean>;
}

export interface ConanConfig {
  generate: boolean;
  requires: string[];
  options?: Record<string, string>;
  generators?: string[];
}

export interface IDEConfig {
  generateCompileCommands: boolean;
  generateVSCode: boolean;
  generateCLion: boolean;
  generateVisualStudio?: boolean;
}

export interface ValidationConfig {
  strictNullChecks: boolean;
  noImplicitAny: boolean;
  noImplicitThis: boolean;
  checkMemoryLeaks: boolean;
  checkCircularDependencies: boolean;
  enforceRAII: boolean;
  custom?: string[];
}

export interface ExperimentalConfig {
  // TypeScript features
  decorators?: boolean;
  decoratorMetadata?: boolean;

  // C++ features
  modules?: boolean;
  contracts?: boolean;
  reflection?: boolean;

  // Transpiler features
  parallelCompilation?: boolean;
  incrementalCompilation?: boolean;
  hotReload?: boolean;
}
