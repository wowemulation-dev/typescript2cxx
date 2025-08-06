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

## Known Limitations

Most core issues have been resolved in v0.1.0:

1. ✅ **C++ Compilation**: All issues fixed - code compiles successfully
2. ✅ **Template Literals**: Interpolation implemented and working
3. ✅ **For Loop**: Increment expressions fixed
4. ✅ **Method Bodies**: Generation working correctly
5. ✅ **Optional Chaining**: Detection and generation implemented
6. **Async/Await**: Requires coroutine implementation (future)
7. **Modules**: ES modules not fully supported (future)

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

## Future Enhancements

### v0.1.1 - Released 2025-01-05

- [x] **TypeScript Compiler API migration** - Complete replacement of SWC
- [x] **Type checker integration** - SimpleTypeChecker for C++ type mappings
- [x] **JSR.io compatibility** - Now ready for JSR publishing
- [x] **Enhanced type support** - Generics, unions, intersections, functions
- [x] **All tests passing** - 50 test steps covering complete functionality

### v0.2.0 - Build System Integration

- [ ] **CMake Build Generation**
  - Auto-generate CMakeLists.txt from TypeScript projects
  - Support for executable and library targets
  - Cross-platform build configuration
  - Integration with vcpkg/Conan
  - Debug/Release configurations
- [ ] **Advanced Type Checker Features**
  - Full TypeScript program analysis
  - Cross-file type resolution
  - Generic constraint validation
- [ ] Module system support
- [ ] More C++ standard library mappings

### v0.1.2 - Next Minor Release

- [ ] Enhanced error messages and diagnostics
- [ ] Source map generation
- [ ] Performance optimizations
- [ ] Memory leak detection

### Future Versions

- [ ] Optimization passes
- [ ] Advanced memory management
- [ ] GPU compute support
- [ ] Async/await with C++20 coroutines
- [ ] Full ES module support
