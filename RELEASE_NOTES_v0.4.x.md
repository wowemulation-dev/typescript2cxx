# Release Notes - v0.4.x Series

## Version 0.4.1 - E2E Compilation Fixes & QA Improvements

_Released: 2025-01-07_
_Note: Features merged into v0.5.0 release_

### Critical Fixes

#### End-to-End Compilation Success

- **Runtime header restructuring**: Resolved circular dependencies in core.h
  - Moved `any` type definition after all dependent type declarations
  - Used forward declarations and typedefs to break circular references
  - Fixed std::variant usage for proper type safety

- **Type inference for expressions**: Fixed invalid extern declarations
  - Binary expressions now properly infer `js::number` type
  - Arithmetic operations generate correct C++ types
  - Eliminated "auto requires initializer" compilation errors

- **Test runner improvements**: Fixed compilation and execution paths
  - Absolute path resolution for runtime includes
  - Correct binary execution paths in temp directories
  - Full --allow-run permissions for subprocess execution

### Quality Assurance

- **Version management**: Updated deno.json version to 0.4.1
- **QA pipeline**: All checks passing (format, lint, type-check, tests)
- **JSR publishing**: Dry run verification successful

### Project Organization

- **Output consolidation**: Unified all generated files under `.output/` directory
  - Replaced 8+ scattered output directories with organized structure
  - `.output/coverage/` - Test coverage data
  - `.output/dist/` - Compiled CLI executable
  - `.output/docs/` - Generated API documentation
  - `.output/cmake-tests/` - CMake integration test results
  - `.output/reports/` - Test reports and analysis

- **Test structure improvements**: Organized integration tests
  - Moved CMake E2E tests to `tests/integration/cmake-e2e.ts`
  - Added `test:cmake` Deno task for easy CMake pipeline testing
  - Clean separation of unit, integration, spec, and E2E tests

- **Configuration cleanup**: Simplified project configuration
  - Single `.gitignore` entry for all generated output
  - Consolidated Deno task output paths
  - Self-documenting output structure with README

### Developer Experience

- **Error messages**: More descriptive C++ compilation errors
- **Test execution**: Reliable E2E test runs with actual compilation
- **Documentation**: Started comprehensive release notes for all versions
- **Repository cleanliness**: Professional project organization with logical file structure

---

## Version 0.4.0 - Advanced TypeScript Features

_Released: 2025-01-07_

### Overview

Version 0.4.0 delivered major TypeScript language features including decorators, exception handling, union types, type guards, and intersection types. This release significantly enhanced the transpiler's capability to handle modern TypeScript patterns.

### Major Features

#### Decorator Support

- **Class decorators**: Full metadata preservation and inheritance
  - Decorator factories with parameters
  - Multiple decorators on same target
  - Metadata storage using `has_metadata<T>` base class pattern
  - Initialization lists for metadata in C++

- **Method decorators**: Transform and enhance methods
  - Access to method descriptor
  - Runtime metadata attachment
  - Support for async methods

- **Property decorators**: Property metadata and validation
  - Property initialization tracking
  - Type metadata preservation
  - Accessor generation support

- **Accessor decorators**: Getter/setter enhancement
  - Separate get/set decorators
  - Value transformation support
  - Lazy initialization patterns

- **Parameter decorators**: Method parameter metadata
  - Parameter index tracking
  - Type information preservation
  - Dependency injection support

#### Exception Handling

- **Try/Catch/Finally blocks**: Complete exception flow
  - Proper stack unwinding semantics
  - Multiple catch clauses support
  - Finally block execution guarantee
  - Nested try/catch handling

- **Error types**: JavaScript-compatible error hierarchy
  - js::any as universal exception type
  - Error, TypeError, ReferenceError classes
  - Stack trace preservation
  - Custom error classes support

- **Throw expressions**: Exception generation
  - Throw any js:: type
  - Re-throw in catch blocks
  - Exception propagation

#### Union Types

- **Type-safe unions**: Runtime-checked union types
  - `string | number` → `js::typed::StringOrNumber`
  - `T | null` → `js::typed::Nullable<T>`
  - `T | undefined` → `js::typed::Optional<T>`
  - Complex unions fallback to `js::any`

- **Union type operations**: Safe type conversions
  - Runtime type checking methods
  - Type narrowing support
  - Union array support
  - Function parameter unions

#### Type Guards

- **typeof operator**: Runtime type checking
  - Generates proper C++ type predicates
  - Integration with control flow
  - Type narrowing in conditionals

- **Type predicate functions**: Custom type guards
  - is_string, is_number, is_boolean helpers
  - Nullable type checking
  - Array type validation
  - Object shape checking

#### Intersection Types

- **Type intersection**: Combining multiple types
  - Basic T & U support
  - Interface intersection
  - Primitive & object intersection
  - Multiple intersection handling

- **C++ mapping strategy**: First-type approach
  - Prioritizes object types over primitives
  - Uses most specific type
  - Maintains type safety

### Testing Infrastructure

- **End-to-end testing**: Full compilation pipeline
  - Cross-platform compiler detection (clang++, g++, MSVC)
  - Automatic C++ compilation and execution
  - Integration test framework
  - Spec test runner with compatibility flags

- **Comprehensive test coverage**:
  - 10 decorator test scenarios
  - 15 exception handling tests
  - 8 union type tests
  - 5 type guard tests
  - 5 intersection type tests

### Code Generation Improvements

- **Enhanced C++ output**: Better code quality
  - Cleaner namespace usage
  - Optimized include statements
  - Improved formatting and indentation
  - Better comment preservation

- **Type system enhancements**: Sophisticated type handling
  - Complex generic resolution
  - Variance handling for unions
  - Intersection type optimization
  - Better type inference

### Performance Optimizations

- **Compilation speed**: Faster transpilation
  - Cached type resolution
  - Optimized AST traversal
  - Reduced memory allocations
  - Parallel processing preparation

- **Runtime efficiency**: Better generated code
  - Inline type checks where possible
  - Optimized union type storage
  - Efficient exception handling
  - Smart pointer optimizations

### Developer Experience

- **Better error messages**: Improved diagnostics
  - Clear type mismatch errors
  - Helpful suggestions for fixes
  - Source location preservation
  - Context-aware messages

- **Enhanced debugging**: Development tools
  - Source map improvements
  - Debug symbol generation
  - Runtime type information
  - Stack trace mapping

### Breaking Changes

- Decorator syntax requires TypeScript 5.0+
- Union types change runtime representation
- Exception types now use js::any base
- Some IR node structures modified

### Bug Fixes

- Fixed decorator inheritance issues
- Resolved union type conversion bugs
- Corrected exception propagation
- Fixed intersection type priority
- Resolved type guard narrowing issues

### Known Issues

- Complex decorator compositions need refinement
- Some edge cases in union type inference
- Async exception handling incomplete
- Generic intersection types limited

### Migration Guide

#### From v0.3.x

1. **Decorators**: Enable experimental decorators in tsconfig
2. **Union types**: Update type assertions for new wrappers
3. **Exceptions**: Migrate catch clauses to handle js::any
4. **Type guards**: Use new runtime type checking helpers

### Next Steps

Version 0.5.0 will focus on:

- Async/await with C++20 coroutines
- Full generic type system
- Advanced type features (conditional, mapped types)
- Module system improvements
- Performance optimizations

---

## Version 0.4.2 - Future Patch Release

_Planned_

### Planned Improvements

- Enhanced decorator composition
- Better union type inference
- Async exception handling
- Generic intersection types
- Performance optimizations

### Planned Bug Fixes

- Edge cases in decorator metadata
- Union type conversion issues
- Exception stack trace accuracy
- Type guard inference problems
