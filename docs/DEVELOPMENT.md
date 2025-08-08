# Development Guide

This document outlines the development process and architecture of `typescript2cxx`.

## Architecture Overview

The transpiler follows a traditional compiler architecture with distinct phases:

```text
TypeScript Source
       ↓
    Parser (TypeScript API)
       ↓
 TypeScript AST
       ↓
   Type Checker
       ↓
   Transformer
       ↓
       IR
       ↓
  Code Generator
       ↓
    C++ Code
```

## Project Structure

```text
src/
├── ast/          # AST parsing with TypeScript Compiler API
│   └── parser.ts # TypeScript parser with feature detection
├── ir/           # Intermediate representation
│   └── nodes.ts  # IR node definitions
├── transform/    # AST to IR transformation
│   └── transformer.ts
├── codegen/      # C++ code generation
│   └── generator.ts
├── memory/       # Memory management analysis
│   ├── analyzer.ts
│   └── types.ts
├── type-checker/ # TypeScript type checking integration
│   ├── checker.ts
│   ├── simple-checker.ts
│   └── types.ts
├── plugins/      # Plugin system
│   ├── loader.ts
│   └── types.ts
├── runtime/      # C++ runtime library
│   └── core.h
├── cli.ts        # Command-line interface
├── transpiler.ts # Main transpiler orchestration
├── types.ts      # Core type definitions
├── errors.ts     # Error handling
└── mod.ts        # Public API exports
```

## Development Workflow

### Prerequisites

- Deno 2.x installed
- C++ compiler (for testing generated code)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/wowemulation-dev/typescript2cxx.git
cd typescript2cxx

# Run tests
deno task test

# Run the CLI
deno run --allow-read --allow-write --allow-env src/cli.ts input.ts -o output
```

### Testing

Run all tests:

```bash
deno task test
```

Run specific test file:

```bash
deno test --allow-read --allow-write --allow-env --allow-net tests/parser.test.ts
```

Run with coverage:

```bash
deno task test:coverage
deno task coverage
```

### Code Style

The project uses Deno's built-in formatter:

```bash
deno fmt
deno lint
```

## Implementation Details

### Parser (ast/parser.ts)

Uses TypeScript Compiler API for accurate parsing with type information:

- Async/await usage
- Generators
- Decorators
- Template literals
- Optional chaining
- Nullish coalescing

### IR Design (ir/nodes.ts)

The IR is designed to be C++-oriented while preserving TypeScript semantics:

- Memory management annotations
- Access modifiers
- Strong typing information
- C++ specific nodes (smart pointers, move semantics)

### Transformer (transform/transformer.ts)

Converts TypeScript AST to IR:

- Scope tracking
- Type resolution
- Memory management inference
- Feature transformation

### Code Generator (codegen/generator.ts)

Generates idiomatic C++ code:

- Header/source separation
- Forward declarations
- Smart pointer usage
- JavaScript-like runtime calls

### Memory Management

The transpiler supports multiple memory strategies:

- **Auto**: Infers best strategy
- **Shared**: Uses shared_ptr
- **Unique**: Uses unique_ptr
- **Manual**: Raw pointers

### Plugin System

Plugins can extend functionality at multiple points:

- Type mappings
- AST/IR transformations
- Custom code emitters
- Lifecycle hooks

## Quick Reference

### Running the Transpiler

```bash
# Basic usage
deno run -A src/cli.ts input.ts -o output/

# With runtime path
deno run -A src/cli.ts input.ts -o output/ --runtime ./runtime

# Watch mode (not yet implemented)
deno run -A src/cli.ts input.ts -o output/ --watch

# With type checking
deno run -A src/cli.ts input.ts -o output/ --check
```

### Running Tests

```bash
# All tests
deno task test

# Unit tests only
deno test src/**/*.test.ts --allow-all

# Spec tests only
deno task spec

# E2E tests (requires C++ compiler)
deno test tests/e2e/ --allow-all

# With coverage
deno task test:coverage
deno task coverage
```

### Development Commands

```bash
# Format code
deno fmt

# Lint
deno lint

# Type check
deno task check

# Build executable
deno task compile
```

## Testing Generated Code

To test if generated C++ code compiles:

```bash
# Transpile a TypeScript file
deno run -A src/cli.ts examples/hello-world.ts -o output/hello-world

# Copy runtime headers
cp -r src/runtime output/hello-world/

# Test compilation with g++
cd output/hello-world
g++ -std=c++20 -I. hello-world.cpp -o hello-world

# Test with clang++
clang++ -std=c++20 -I. hello-world.cpp -o hello-world
```

**Note**: The generated code currently has compilation issues that are being addressed.

## Current Implementation Status (v0.5.3)

### ✅ Fully Implemented Features

1. **TypeScript Compiler API** - Complete type checking and analysis
2. **Basic Language Constructs** - Variables, functions, classes, interfaces
3. **Control Flow** - If/else, for, while, do-while, break, continue, switch/case
4. **Operators** - All arithmetic, logical, comparison, assignment operators
5. **Template Literals** - Full interpolation support
6. **Optional Chaining** - Safe property access with null checks
7. **Class System** - Inheritance, constructors, methods, static members, abstract classes
8. **Exception Handling** - Try/catch/finally/throw
9. **Decorators** - Class, method, property, accessor decorators
10. **Advanced Types** - Unions, intersections, type guards
11. **Abstract Classes** - Pure virtual functions, multi-level inheritance (v0.5.3)
12. **Switch Statements** - Full support with fall-through (v0.5.3-dev)
13. **For...of/in Loops** - Iterator and enumeration support (v0.5.3-dev)
14. **Function Parameters** - Default and optional parameters (v0.5.3-dev)
15. **Expression Handling** - Parenthesized expressions (v0.5.3)
16. **Build System Generation** - CMake integration with --cmake flag (v0.5.2)

### 🔧 Partially Implemented

1. **Functions** - Default/optional parameters done, rest parameters pending
2. **Generics** - Basic type parameters, no constraints or variance
3. **Type System** - Most types work, missing conditional/mapped types
4. **Objects/Arrays** - Literals work, destructuring partially supported

### ❌ Not Implemented

1. **Async/Await** - Requires C++20 coroutine implementation
2. **Modules** - No ES module import/export support
3. **Spread Operator** - Not fully implemented
4. **Nullish Coalescing** - ?? operator not fully supported
5. **Logical Assignment** - &&=, ||=, ??= operators not implemented
6. **Arrow Functions** - Not fully implemented with array methods

## Contributing

1. Check existing issues and discussions
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Format and lint code
6. Submit a pull request

## Debugging Tips

### Enable verbose output

```bash
deno run -A src/cli.ts input.ts -o output -v
```

### Inspect IR

Add `console.log(JSON.stringify(ir, null, 2))` in transpiler.ts

### Test specific features

Create minimal test cases in test files

## Release History

### v0.5.3 - 2025-01-08

- ✅ Abstract classes and methods implementation
- ✅ Pure virtual functions for C++ generation
- ✅ Parenthesized expressions support
- ✅ Enhanced smart pointer detection
- ✅ Runtime type conversion improvements
- ✅ Constructor parameter fixes
- ✅ 8 new comprehensive test suites

### v0.5.2 - 2025-01-14

- ✅ Configuration improvements
- ✅ Development workflow enhancements
- ✅ Hook configuration cleanup

### v0.5.1 - 2025-01-14

- ✅ QA pipeline improvements
- ✅ TypeScript configuration fixes
- ✅ Test infrastructure enhancements

### v0.5.0 - 2025-08-07

- ✅ Project organization (.output directory)
- ✅ E2E testing framework
- ✅ CMake build system integration

### v0.4.1 - 2025-01-07

- ✅ Fixed E2E compilation issues
- ✅ Resolved circular dependencies in runtime
- ✅ Type inference for binary expressions
- ✅ Test runner improvements

### v0.4.0 - 2025-01-07

- ✅ Decorator support with metadata
- ✅ Union and intersection types
- ✅ Type guards and typeof operator
- ✅ Exception handling (try/catch/finally)
- ✅ E2E test infrastructure

### v0.3.0 - 2025-01-06

- ✅ Complete JavaScript runtime library
- ✅ Math, Date, RegExp, JSON, Console objects
- ✅ Error hierarchy implementation
- ✅ 40+ runtime tests

### v0.2.0 - 2025-01-06

- ✅ Enhanced TypeScript support
- ✅ Control flow statements
- ✅ Class system improvements
- ✅ Expression handling

### v0.1.1 - 2025-01-05

- ✅ TypeScript Compiler API migration
- ✅ Type checker integration
- ✅ JSR.io compatibility
- ✅ Enhanced type support

### v0.1.0 - 2025-01-05

- ✅ Initial release
- ✅ Basic transpilation working
- ✅ Core IR design
- ✅ Plugin system

## Roadmap

### Next: v0.5.4 - Modern Operators & Functions

- [ ] Logical assignment operators (&&=, ||=, ??=)
- [ ] Rest parameters for functions
- [ ] Arrow functions with proper this binding
- [ ] Array methods (map, filter, reduce improvements)
- [ ] Enum functionality fixes

### Future: v0.6.0 - Async/Await & Modules

- [ ] Async/await with C++20 coroutines
- [ ] ES module import/export
- [ ] Dynamic imports
- [ ] Promise implementation
- [ ] Module resolution and bundling

### Future: Modern JavaScript Features

- [ ] Full destructuring (objects and arrays)
- [ ] Complete spread operator implementation
- [ ] Nullish coalescing operator completion
- [ ] Numeric separators
- [ ] BigInt support
- [ ] Symbol implementation

### Future: Advanced Type System

- [ ] Conditional types
- [ ] Mapped types
- [ ] Template literal types
- [ ] Const assertions
- [ ] Satisfies operator

### Future: Production Features

- [ ] Source maps
- [ ] Optimization passes
- [ ] Full test coverage
- [ ] Complete documentation
