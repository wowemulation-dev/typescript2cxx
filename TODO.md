# TODO List

This document tracks planned features and known issues for typescript2cxx.

## ✅ Completed (v0.1.0)

### Fixed Issues

- ✅ **C++ Compilation Issues** - All resolved:
  - ✅ Header file naming fixed (uses outputName correctly)
  - ✅ Method implementation generation working (display() method generates)
  - ✅ This pointer syntax fixed (`this->member` instead of `this.member`)
  - ✅ Top-level statements placed in Main() function
  - ✅ Generated code compiles successfully with clang++ and g++

- ✅ **Template Literal Interpolation** - Working correctly
  - ✅ Expression interpolation implemented
  - ✅ String concatenation with js::toString()

- ✅ **For Loop Increment** - Fixed
  - ✅ UpdateExpression support added
  - ✅ Proper increment/decrement generation

- ✅ **Method Body Generation** - Complete
  - ✅ All method types handled correctly
  - ✅ Constructor generation with proper C++ syntax

- ✅ **Code Quality** - All issues resolved
  - ✅ 0 linting issues (147 → 0)
  - ✅ 0 type checking errors (4 → 0)
  - ✅ All tests passing (124/124 steps: 88 spec + 36 unit)

- ✅ **Memory Annotations** - Complete
  - ✅ JSDoc comment parsing (@weak, @shared, @unique)
  - ✅ Code generation with proper smart pointer types
  - ✅ Memory management flow through transformer pipeline

- ✅ **Optional Chaining** - Complete
  - ✅ Detection in AST parser
  - ✅ C++ code generation with null checks
  - ✅ Proper handling of computed/non-computed access

- ✅ **Runtime Include Path** - Complete
  - ✅ CLI --runtime option
  - ✅ Pipeline integration
  - ✅ Configurable header paths

- ✅ **GitHub Actions Security** - Complete
  - ✅ Removed -A (allow-all) flags
  - ✅ Explicit permission specifications
  - ✅ Updated all workflows and deno.json tasks

- ✅ **Deprecated Imports** - Complete
  - ✅ Fixed parse import to use parseArgs
  - ✅ Updated to correct standard library modules

## 🎯 Active Development (v0.1.1)

### High Priority

- [ ] **JSR Publishing Support**
  - Migrate from deno.land/x/swc to JSR-compatible parser
  - Options: pure JS/TS parser, vendor swc, or separate CLI/library packages
  - Currently blocked by swc native bindings requirement

### ✨ Core Features

- ✅ **Memory Annotations** - Complete
  - ✅ Parse JSDoc comments for @weak, @shared, @unique
  - ✅ Apply annotations to generated code
  - ✅ Example: `/** @weak */ parent: Node;`

- [ ] **Type Checker Integration**
  - Use TypeScript Compiler API for accurate type information
  - Better type resolution
  - Generic type support

## Medium Priority

### 🚀 Features

- [ ] **Source Maps**
  - Generate source maps for debugging
  - Map C++ lines back to TypeScript

- [ ] **Module System**
  - Support ES modules import/export
  - Generate proper C++ namespaces
  - Handle circular dependencies

- [ ] **Async/Await**
  - Implement using C++20 coroutines
  - Generate proper async function signatures
  - Handle promise types

- [ ] **Optimization Passes**
  - Dead code elimination
  - Constant folding
  - Inline simple functions

- [ ] **Better Type Mappings**
  - Map, Set, WeakMap, WeakSet
  - Promise, ArrayBuffer
  - Typed arrays

### 🛠️ Tooling

- [ ] **CMake Build System Integration** (v0.2.0)
  - Generate CMakeLists.txt files for C++ projects
  - CLI option: `--cmake` or `--build-system cmake`
  - Support for executable and library targets
  - Automatic dependency management
  - Cross-platform build configuration (Windows/Linux/macOS)
  - Integration with vcpkg/Conan package managers
  - Debug/Release build configurations
  - Custom CMake module detection
  - Automatic runtime library linking

- [ ] **Additional Build Systems**
  - Makefile generation
  - Package.json scripts
  - Meson build files

- [ ] **Error Recovery**
  - Continue transpilation after errors
  - Generate partial output
  - Better error messages

- [ ] **Performance Profiling**
  - Track transpilation time by phase
  - Memory usage statistics
  - Optimization suggestions

## Low Priority

### 🎨 Code Quality

- [ ] **Code Formatting**
  - Respect C++ style guides
  - Configurable formatting options
  - Integration with clang-format

- [ ] **Documentation Generation**
  - Generate Doxygen comments
  - Preserve JSDoc comments
  - API documentation

- [ ] **Test Coverage**
  - Increase test coverage to 90%+
  - Property-based testing
  - Fuzzing

### 🔧 Advanced Features

- [ ] **Reflection Support**
  - Generate RTTI information
  - Runtime type checking
  - Serialization support

- [ ] **Interop Improvements**
  - Better C++ library integration
  - FFI support
  - Bindings generation

- [ ] **Advanced Memory Management**
  - Custom allocators
  - Memory pools
  - Garbage collection integration

## Future Ideas

### 🌟 Experimental

- [ ] **WASM Target**
  - Generate WebAssembly alongside C++
  - Shared runtime library
  - Browser compatibility

- [ ] **GPU Compute**
  - Generate CUDA/OpenCL kernels
  - Parallel array operations
  - GPU memory management

- [ ] **Game Engine Integration**
  - Unreal Engine plugin
  - Unity native plugin
  - Custom engine support

### 📚 Research

- [ ] **Advanced Type System**
  - Dependent types
  - Linear types for memory safety
  - Effect system

- [ ] **Optimization Research**
  - Machine learning for optimization
  - Profile-guided optimization
  - Superoptimization

## Contributing

To work on any of these items:

1. Comment on the issue if one exists
2. Create a feature branch
3. Write tests first
4. Implement the feature
5. Submit a PR with description

Priority guidelines:

- 🐛 Bug fixes always welcome
- ✨ Core features need discussion
- 🚀 Features need design docs
- 🎨 Code quality improvements welcome
- 🔧 Advanced features need RFC
