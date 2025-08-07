# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- fix: Add coverage files to .gitignore (cov_profile/, coverage.lcov)

## [0.5.0] - 2025-08-07

### Fixed

- fix: Circular dependency resolution in runtime/core.h
- fix: Type inference for binary expressions generating invalid extern declarations
- fix: Test runner absolute path resolution for runtime includes
- fix: Test execution permissions with full --allow-run flag
- fix: E2E compilation issues preventing C++ code from compiling

### Changed

- refactor: Restructured runtime header to define simple types before complex types
- refactor: Enhanced code generator type inference for arithmetic operations
- refactor: **Project Organization** - Consolidated all output into unified `.output/` directory structure
  - Replaced 8+ scattered directories (cmake-test-output, cov_profile, etc.) with organized subdirectories
  - All generated files now in `.output/{coverage,dist,docs,cmake-tests,reports}/`
  - Moved CMake integration tests to `tests/integration/cmake-e2e.ts`
  - Simplified .gitignore to single `.output/` entry
  - Added `test:cmake` Deno task for E2E pipeline testing
- chore: Updated version to 0.5.0 in deno.json

### Documentation

- docs: Created comprehensive release notes for v0.2.x, v0.3.x, and v0.4.x
- docs: Updated README with current project status and achievements
- docs: Enhanced feature compatibility tables

## [0.4.0] - 2025-08-07

### Added

- feat: **Decorator Support** - Complete decorator implementation with metadata preservation
  - Class, method, property, and accessor decorators
  - Decorator factories with parameters
  - Multiple decorators on same target
  - C++ metadata storage using has_metadata<T> pattern

- feat: **Exception Handling** - Full try/catch/finally support
  - Proper stack unwinding semantics
  - js::any as universal exception type
  - Error hierarchy (Error, TypeError, ReferenceError)
  - Nested try/catch blocks

- feat: **Union Types** - Type-safe runtime unions
  - string | number → js::typed::StringOrNumber
  - T | null → js::typed::Nullable<T>
  - T | undefined → js::typed::Optional<T>
  - Complex unions fallback to js::any

- feat: **Type Guards** - Runtime type checking
  - typeof operator implementation
  - Type predicate functions (is_string, is_number, etc.)
  - Nullable type checking helpers
  - Control flow type narrowing

- feat: **Intersection Types** - Basic intersection support
  - T & U type combinations
  - Interface intersection
  - Primitive & object intersection
  - First-type prioritization strategy

### Testing

- feat: End-to-end test runner with C++ compilation
- feat: Cross-platform compiler detection (clang++, g++, MSVC)
- feat: Automatic compilation and execution of generated code
- feat: 40+ new test cases for advanced features

## [0.3.0] - 2025-08-06

### Added - Comprehensive JavaScript Runtime Library

#### Core Runtime Types

- feat: **Complete js::string implementation** - 30+ methods including charAt, slice, split, replace, trim, toUpperCase, toLowerCase, indexOf, etc.
- feat: **Enhanced js::number** - IEEE 754 double with NaN, Infinity constants, formatting methods
- feat: **Full js::array<T> implementation** - forEach, map, filter, reduce, find, findIndex, includes, join, push, pop, slice, splice, etc.
- feat: **js::object with prototype chain** - Dynamic property access and inheritance support
- feat: **js::any with std::variant** - Dynamic typing system for mixed-type operations

#### Standard JavaScript Objects

- feat: **Complete Math object** - PI, E, abs, max, min, random, sin, cos, tan, sqrt, pow, floor, ceil, round, etc.
- feat: **Full Date implementation** - now, getFullYear, getMonth, getDate, toString, toISOString, getTime, etc.
- feat: **RegExp object** - Regular expression support with test, exec methods and flag handling
- feat: **Enhanced console object** - log, error, warn, info, debug, trace methods with proper formatting
- feat: **JSON object** - stringify and parse methods for object serialization

#### Global Functions & Utilities

- feat: **Type parsing functions** - parseInt with radix support (2-36), parseFloat with proper validation
- feat: **Validation functions** - isNaN, isFinite for number validation
- feat: **URI functions** - encodeURI, decodeURI, encodeURIComponent, decodeURIComponent
- feat: **Type conversion utilities** - Comprehensive JavaScript-to-C++ type mapping

#### Error System

- feat: **Complete Error hierarchy** - Error, TypeError, ReferenceError, SyntaxError, RangeError classes
- feat: **Stack trace support** - Error objects include message and stack information
- feat: **Exception handling** - Proper C++ exception integration for JavaScript errors

#### Code Generation Enhancements

- feat: **Enhanced type mapping** - Map Date, RegExp, Promise<T>, Array<T> to appropriate C++ types
- feat: **Global identifier mapping** - Math, Date, JSON, console mapped to js:: namespace
- feat: **Improved literal generation** - Proper handling of NaN, Infinity, null, undefined
- feat: **Member access generation** - Static method calls for Math::PI, Date::now, etc.
- feat: **Template literal improvements** - Better string interpolation and concatenation

#### Memory Management

- feat: **Smart pointer optimization** - js:: runtime types exclude smart pointer wrapping
- feat: **Efficient object allocation** - Optimized memory patterns for JavaScript objects
- feat: **Reference counting** - Proper cleanup for complex object relationships

#### Testing & Quality

- feat: **Comprehensive test suite** - 30+ test cases covering all runtime features
- feat: **Runtime verification** - Tests for string, number, array, object operations
- feat: **Integration tests** - Full transpilation pipeline testing with runtime features

### Changed

- **BREAKING**: Enhanced runtime library with 1000+ lines of new C++ code
- **BREAKING**: Updated all type mappings to use comprehensive js:: runtime types
- refactor: Code generator now properly handles JavaScript standard objects
- refactor: Improved identifier mapping for built-in JavaScript globals
- refactor: Enhanced literal generation for JavaScript special values
- refactor: Member access generation supports static method calls

### Fixed

- fix: Method call generation issues for string and array methods
- fix: NaN and Infinity literal generation
- fix: Math, Date, JSON static method access
- fix: Error constructor generation
- fix: Template literal interpolation with proper escaping
- fix: Object property access with dynamic keys

### Performance

- perf: Optimized string operations with efficient C++ implementations
- perf: Fast array methods using modern C++ algorithms
- perf: Efficient object property access with hash maps
- perf: Memory-efficient type conversion utilities

### Documentation

- docs: Updated README with comprehensive v0.3.0 runtime features
- docs: Added runtime library documentation with all available methods
- docs: Enhanced examples showcasing JavaScript runtime capabilities
- docs: Updated type mapping tables with new runtime types

### Notes

This is a major release that implements a complete JavaScript runtime environment
in C++. The transpiler can now handle complex JavaScript operations including:

- Advanced string manipulation and parsing
- Full array processing with functional programming methods
- Mathematical computations with the complete Math object
- Date/time operations with timezone support
- Regular expression pattern matching
- JSON serialization and deserialization
- Comprehensive error handling and exceptions
- Dynamic typing with proper type conversions

The runtime library provides over 100 JavaScript methods and functions, making
it possible to transpile sophisticated JavaScript/TypeScript code while
maintaining full semantic compatibility.

## [0.1.7] - 2025-08-06

### Fixed

- fix: Documentation formatting issues preventing JSR.io publish
- fix: Escaped JSDoc comments in code examples
- fix: Changed glob pattern example to avoid formatter errors

### Notes

This release fixes documentation formatting that was preventing the package
from publishing to JSR.io. All QA checks now pass.

## [0.1.6] - 2025-08-06

### Documentation

- docs: Enhanced module documentation for better JSR.io score
- docs: Added comprehensive JSDoc comments to all exported functions
- docs: Added usage examples and feature descriptions
- docs: Documented CLI module with installation and usage instructions

### Notes

This release improves documentation to achieve a better JSR.io package score.
No functional changes.

## [0.1.5] - 2025-08-06

### Fixed

- fix: JSR publish workflow now uses token authentication

### Notes

This release adds JSR_TOKEN authentication to the publish workflow as a
temporary solution until OIDC authentication with linked repositories is working.

## [0.1.4] - 2025-08-06

### Fixed

- fix: JSR publishing authentication via linked repository on JSR.io

### Notes

This release tests the JSR publishing workflow after linking the GitHub
repository on JSR.io for automatic authentication with `deno publish`.

## [0.1.3] - 2025-08-06

### Added

- feat: First official JSR.io publication
- feat: Package now available at jsr.io/@wowemulation-dev/typescript2cxx

### Documentation

- docs: Consolidated v0.1.x release notes into single file
- docs: Updated installation instructions to prioritize JSR

### Notes

This release marks the first successful publication to JSR.io. The package
is now easily installable via `deno add` and `deno install` commands.
All functionality remains the same as v0.1.2.

## [0.1.2] - 2025-08-06

### Added

- feat: JSR.io publishing workflow enabled
- feat: JSR package verification in CI pipeline

### Fixed

- fix: Code formatting issues in CHANGELOG.md
- fix: Enabled JSR publish workflow (was disabled)
- fix: Added JSR package dry-run verification to CI

### Changed

- chore: All QA checks passing (format, lint, type check, tests)

### Notes

This is a quick follow-up release to v0.1.1 that enables JSR.io publishing.
The TypeScript Compiler API migration from v0.1.1 makes this possible.

## [0.1.1] - 2025-08-06

### Added

- feat: **TypeScript Compiler API integration** - Complete migration from SWC to TypeScript API
- feat: **SimpleTypeChecker** - Type resolution without full program creation
- feat: **Enhanced type support** - Generic types (Array<T>, Promise<T>), unions, intersections
- feat: **Function type resolution** - Proper C++ std::function generation
- feat: **Type checking integration** - Basic type validation in parser
- feat: memory annotation support from JSDoc comments (@weak, @shared, @unique)
- feat: optional chaining detection and generation
- feat: runtime include path configuration via --runtime CLI option

### Changed

- **BREAKING**: Replaced SWC parser with TypeScript Compiler API (npm:typescript@5.7.3)
- refactor: Parser now returns synchronous results (no longer async)
- refactor: Transformer updated to work with TypeScript AST nodes
- refactor: All node type checks now use ts.SyntaxKind enums
- refactor: updated GitHub Actions to use explicit permissions instead of -A flag
- refactor: updated test tasks in deno.json to include --allow-net permission

### Fixed

- fix: deprecated parse import replaced with parseArgs from @std/cli/parse_args
- fix: all C++ compilation issues resolved - generated code now compiles successfully
- fix: runtime include path now flows through the transpilation pipeline
- fix: memory annotations properly applied in code generation
- fix: optional chaining expressions generate correct C++ code
- fix: Decorator API compatibility with latest TypeScript
- fix: Property transformation to use 'type' instead of 'cppType'
- fix: All 50 test steps now passing after migration

### Removed

- **BREAKING**: Removed deno.land/x/swc dependency
- Removed SWC-specific AST handling code

## [0.1.0] - 2025-08-05

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
