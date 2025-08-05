# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- feat: memory annotation support from JSDoc comments (@weak, @shared, @unique)
- feat: optional chaining detection and generation
- feat: runtime include path configuration via --runtime CLI option

### Changed

- refactor: updated GitHub Actions to use explicit permissions instead of -A flag
- refactor: updated test tasks in deno.json to include --allow-net permission

### Fixed

- fix: deprecated parse import replaced with parseArgs from @std/cli/parse_args
- fix: all C++ compilation issues resolved - generated code now compiles successfully
- fix: runtime include path now flows through the transpilation pipeline
- fix: memory annotations properly applied in code generation
- fix: optional chaining expressions generate correct C++ code

## [0.1.0] - 2025-01-14

### Added

#### Core Infrastructure

- feat: initialize Deno project with TypeScript configuration
- feat: add dual MIT/Apache-2.0 licensing
- feat: add JSR package configuration for `@wowemulation-dev/typescript2cxx`
- feat: add comprehensive README with game engine examples
- feat: add CLAUDE.md with AI assistance guidelines
- feat: add reference to local prototype implementation

#### Parser

- feat: implement TypeScript AST parser using swc
- feat: add feature detection for async, generators, decorators, template literals
- feat: add support for TypeScript syntax (interfaces, type annotations, generics)
- feat: implement parse error handling with source locations

#### Intermediate Representation (IR)

- feat: design comprehensive IR node system for C++ translation
- feat: add memory management annotations (shared, unique, weak, raw, value, auto)
- feat: implement access modifiers (public, private, protected)
- feat: add variable kinds (const, let, var)
- feat: support all major statement and expression types

#### AST to IR Transformation

- feat: implement complete AST to IR transformer
- feat: add scope tracking for variable resolution
- feat: support function declarations with parameters and return types
- feat: support class declarations with methods and properties
- feat: implement control flow statements (if, while, for)
- feat: handle TypeScript type annotations and map to IR types

#### C++ Code Generation

- feat: implement C++ code generator from IR
- feat: generate separate header (.h) and source (.cpp) files
- feat: add header guards and forward declarations
- feat: implement type mapping from TypeScript to C++ types
- feat: generate JavaScript-like runtime calls (console.log, string literals)
- feat: support smart pointer generation for heap allocations
- feat: generate proper class definitions with access levels
- feat: implement main entry point generation

#### Runtime Library

- feat: port and modernize C++ runtime library (core.h)
- feat: implement JavaScript-like types (js::string, js::number, js::array, js::object)
- feat: add console API implementation
- feat: support string literal operator (_S)
- feat: implement any type for dynamic typing

#### CLI Tool

- feat: implement command-line interface with argument parsing
- feat: add watch mode support
- feat: add build command for batch processing
- feat: support output directory specification
- feat: add verbose and quiet modes
- feat: implement file/directory exclusion patterns

#### Plugin System

- feat: design extensible plugin architecture
- feat: implement plugin loader
- feat: add lifecycle hooks (onInit, onBeforeTransform, onAfterTransform, onComplete)
- feat: support custom type mappings
- feat: enable custom transformers and emitters
- feat: create game engine plugin example

#### Testing

- feat: add comprehensive test suite using Deno's testing framework
- feat: implement parser tests with feature detection
- feat: add transpiler integration tests
- feat: test memory management annotations
- feat: verify C++ standard option handling

#### Memory Management

- feat: add memory analyzer module structure
- feat: support memory strategy options (auto, shared, unique, manual)
- feat: implement memory management enums in IR

#### Developer Experience

- feat: add TypeScript type definitions for all public APIs
- feat: implement error reporting with source locations
- feat: add transpilation statistics tracking
- feat: support source map generation (placeholder)

### Changed

- refactor: separate plugin types into distinct modules
- refactor: improve error handling with custom error classes
- refactor: organize exports in mod.ts for clean API

### Fixed

- fix: correct swc import to use parse instead of parseModule
- fix: remove unsupported allowJs compiler option
- fix: add proper type exports to avoid circular dependencies
- fix: export AccessModifier and VariableKind enums
- fix: handle parse errors with try-catch pattern
- fix: correct parameter types in transformer and generator
- fix: add missing IR node types (Array, Assignment, Conditional, Interface, New, Object, Unary expressions)
- fix: resolve all TypeScript type mismatches in transformer and generator
- fix: clean up unused variables and parameters throughout codebase
- fix: remove unnecessary async keywords from synchronous functions
- fix: properly export IRNode type from plugins module

### Security

- security: avoid executing arbitrary code from untrusted sources
- security: implement defensive checks in parser and transformer

### Documentation

- docs: add comprehensive development guide (docs/DEVELOPMENT.md)
- docs: add release process documentation (docs/RELEASE.md)
- docs: add TODO list for tracking future work
- docs: add contribution guidelines (CONTRIBUTING.md)
- docs: add game engine examples and WoW-specific use cases to README

### CI/CD

- ci: add continuous integration workflow for PRs and main branch
- ci: add automated JSR publishing on version tags
- ci: add GitHub release creation workflow with changelog extraction

[0.1.0]: https://github.com/wowemulation-dev/typescript2cxx/releases/tag/v0.1.0
