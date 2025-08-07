# typescript2cxx

A Deno-native TypeScript to C++20 transpiler for generating high-performance C++
code from TypeScript sources, targeting World of Warcraft emulation projects.

<div align="center">

[![Discord](https://img.shields.io/discord/1394228766414471219?logo=discord&style=flat-square)](https://discord.gg/QbXn7Vqb)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE-APACHE)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE-MIT)

</div>

## Purpose

This transpiler enables WoW emulation developers to:

- Write game logic in TypeScript with type safety
- Generate optimized C++20 code for emulation cores
- Maintain consistency across different emulation projects
- Leverage modern JavaScript tooling while targeting C++ performance

## Features

- **Modern C++20 Output** - Utilizes concepts, coroutines, and modules
- **Type Safety** - Preserves TypeScript type information in C++
- **Performance Focus** - Generates optimized code patterns for game emulation
- **Extensible Plugin System** - Support for custom transformations
- **Spec-Driven Development** - Test-first approach ensuring correctness

## Quick Start

### Installation & Usage

> **Note**: This package uses the TypeScript Compiler API (npm:typescript) for parsing and type checking.
> It is now published on JSR.io and can be easily installed in any Deno project.

#### Install from JSR (Recommended)

```bash
# Install globally as a CLI tool
deno install -Arf -n tsc2cxx jsr:@wowemulation-dev/typescript2cxx/cli

# Use the installed CLI
tsc2cxx input.ts -o output/

# Or add to your project
deno add @wowemulation-dev/typescript2cxx
```

#### Install from Source

```bash
# Clone the repository
git clone https://github.com/wowemulation-dev/typescript2cxx
cd typescript2cxx

# Run directly with Deno
deno run --allow-net --allow-read --allow-write src/cli.ts input.ts

# Or build an executable
deno compile --allow-net --allow-read --allow-write --output typescript2cxx src/cli.ts
./typescript2cxx input.ts
```

### Module Usage

```typescript
// Import from JSR
import { transpile } from "@wowemulation-dev/typescript2cxx";

// Or import from local source
// import { transpile } from "./src/mod.ts";

// Transpile TypeScript to C++
const result = await transpile(`
  class Point {
    x: number = 42;
    
    display(): void {
      console.log(\`Point x: \${this.x}\`);
    }
  }
  
  let p = new Point();
  p.display();
`);

console.log(result.header); // Generated C++ header
console.log(result.source); // Generated C++ source
```

## TypeScript to C++ Mappings

### Basic Types (v0.3.0)

| TypeScript  | C++20                    | Implementation Status |
| ----------- | ------------------------ | --------------------- |
| `number`    | `js::number` (double)    | ✅ Working            |
| `string`    | `js::string`             | ✅ Working            |
| `boolean`   | `bool`                   | ✅ Working            |
| `any`       | `js::any` (std::variant) | ✅ Working            |
| `void`      | `void`                   | ✅ Working            |
| `null`      | `js::null`               | ✅ Working            |
| `undefined` | `js::undefined`          | ✅ Working            |

### Complex Types (v0.3.0)

| TypeScript        | C++20                  | Implementation Status |
| ----------------- | ---------------------- | --------------------- |
| `T[]`             | `js::array<T>`         | ✅ Working            |
| `Array<T>`        | `js::array<T>`         | ✅ Working            |
| `object`          | `js::object`           | ✅ Working            |
| `class`           | C++ class with methods | ✅ Working            |
| `new T()`         | `std::make_shared<T>`  | ✅ Working            |
| Template literals | String concatenation   | ✅ Working            |
| `Date`            | `js::Date`             | ✅ Working            |
| `RegExp`          | `js::RegExp`           | ✅ Working            |
| `Promise<T>`      | `std::future<T>`       | ✅ Working            |
| `Error`           | `js::Error`            | ✅ Working            |

### Comprehensive JavaScript Runtime (v0.3.0)

The `runtime/core.h` provides a complete JavaScript-compatible runtime:

#### Core Types

- **js::string** - Full JavaScript string with 30+ methods (charAt, slice, split, replace, etc.)
- **js::number** - IEEE 754 double with NaN/Infinity support and parsing methods
- **js::array<T>** - JavaScript-compatible arrays with forEach, map, filter, reduce, etc.
- **js::object** - Prototype-based objects with dynamic property access
- **js::any** - Dynamic typing using std::variant

#### Standard Objects

- **js::Math** - Complete Math object (PI, random, abs, max, min, sin, cos, etc.)
- **js::Date** - Full Date/time API (now, getFullYear, toString, etc.)
- **js::RegExp** - Regular expression support with test/exec methods
- **js::console** - All console methods (log, error, warn, info, debug, trace)
- **js::JSON** - stringify and parse methods for object serialization

#### Global Functions

- **parseInt/parseFloat** - String to number conversion with radix support
- **isNaN/isFinite** - Number validation functions
- **encodeURI/decodeURI** - URI encoding/decoding
- **setTimeout/setInterval** - Timer functions (planned)

#### Error Types

- **js::Error** - Base error class with message and stack
- **js::TypeError** - Type-related errors
- **js::ReferenceError** - Reference errors
- **js::SyntaxError** - Syntax errors
- **js::RangeError** - Range errors

### Future Planned Features

### Type System Enhancements

| TypeScript   | Planned C++20          | Status     |
| ------------ | ---------------------- | ---------- |
| `bigint`     | `std::int64_t`         | 📋 Planned |
| `unknown`    | `std::variant<...>`    | 📋 Planned |
| `Promise<T>` | C++20 coroutines       | 📋 Planned |
| `interface`  | `struct` with concepts | 📋 Planned |
| `enum`       | `enum class`           | 📋 Planned |

### Build System Integration

| Feature               | Description                   | Target Version |
| --------------------- | ----------------------------- | -------------- |
| CMake Generation      | Auto-generate CMakeLists.txt  | v0.2.0         |
| Cross-platform Builds | Windows/Linux/macOS support   | v0.2.0         |
| Package Managers      | vcpkg/Conan integration       | v0.2.0         |
| Library Targets       | Static/shared library support | v0.2.0         |

## CLI Usage

### Basic Commands

```bash
# Transpile a TypeScript file
deno run --allow-net --allow-read --allow-write src/cli.ts input.ts

# Specify output directory
deno run --allow-net --allow-read --allow-write src/cli.ts -o output/ input.ts

# Use custom C++ standard
deno run --allow-net --allow-read --allow-write src/cli.ts --std c++20 input.ts

# Custom runtime include path
deno run --allow-net --allow-read --allow-write src/cli.ts --runtime "my/runtime.h" input.ts
```

### Available Options

- `--std <standard>` - C++ standard (c++17, c++20, c++23)
- `--readable <mode>` - Code readability mode
- `--optimization <level>` - Optimization level (O0-O3, Os)
- `--memory <strategy>` - Memory management strategy
- `--runtime <path>` - Custom runtime include path
- `--plugin <name>` - Load transpiler plugins

### Planned Options (v0.2.0)

- `--cmake` - Generate CMakeLists.txt build files
- `--build-system <type>` - Select build system (cmake, make, meson)
- `--target <type>` - Build target type (executable, library)
- `--package-manager <pm>` - Package manager integration (vcpkg, conan)

## Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Architecture and development workflow
- [Changelog](CHANGELOG.md) - Version history and changes
- [TODO List](TODO.md) - Planned features and known issues

## Current Status

**Version: 0.3.0** - Comprehensive JavaScript Runtime

The transpiler now includes a complete JavaScript runtime environment in C++:

### ✅ **Core Features Working**

- **TypeScript Parsing** - Complete AST support with TypeScript Compiler API
- **Code Generation** - Generates valid C++20 header and source files
- **Type System** - Full type mapping with integrated TypeScript type checker
- **Classes & Methods** - Complete class transpilation with constructors
- **Template Literals** - String interpolation with proper concatenation
- **Smart Pointers** - Automatic memory management with `std::shared_ptr`
- **Comprehensive Runtime** - Complete JavaScript runtime with 1000+ lines of C++
- **Standard Objects** - Math, Date, RegExp, JSON, console, Error classes
- **CLI Tool** - Full-featured command-line interface
- **C++ Compilation** - Generated code compiles successfully with clang++ and g++

### ✅ **New in v0.3.0**

- **🚀 Complete JavaScript Runtime** - All major JavaScript types and objects
- **🧮 Math Operations** - Full Math object with all standard methods
- **📅 Date/Time Support** - Complete Date API with timezone handling
- **🔤 Advanced Strings** - 30+ string methods (split, replace, trim, etc.)
- **📊 Array Methods** - forEach, map, filter, reduce, find, and more
- **🔍 Regular Expressions** - Full RegExp support with test/exec
- **🐛 Error Handling** - Complete Error class hierarchy
- **📝 JSON Support** - stringify/parse for object serialization
- **⚡ Global Functions** - parseInt, parseFloat, isNaN, URI encoding
- **🎯 Type Safety** - Comprehensive type mapping to C++ equivalents

### ✅ **Verified Compatibility**

- **clang++ 20.1.2** - C++20 standard support
- **g++ 14.2.0** - C++20 standard support
- **Executable Generation** - Programs compile and run correctly
- **Quality Checks** - 0 linting issues, 0 type errors, 50 test steps passing

### 🔧 **Example Output**

```typescript
// TypeScript Input - Showcasing v0.3.0 Runtime
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((x) => x * 2);
const sum = numbers.reduce((a, b) => a + b, 0);

const message = `Numbers: ${numbers.join(", ")}`;
console.log(message.toUpperCase());
console.log(`Sum: ${sum}, PI: ${Math.PI}`);

const now = new Date();
console.log(`Current year: ${now.getFullYear()}`);
```

Generates working C++20 code with full JavaScript semantics and runtime support!

### ✅ **Latest Features (v0.3.0)**

- ✅ **MAJOR**: Complete JavaScript Runtime Library in C++
- ✅ **1000+ Lines**: Comprehensive runtime implementation with full JavaScript semantics
- ✅ **Standard Objects**: Math, Date, RegExp, JSON, console, Error classes
- ✅ **Array Methods**: 20+ array methods including forEach, map, filter, reduce
- ✅ **String Methods**: 30+ string methods including split, replace, trim, slice
- ✅ **Type Conversion**: Global functions for parsing and validation
- ✅ **Memory Management**: Smart pointer integration for runtime objects
- ✅ **Test Coverage**: 30+ comprehensive runtime tests

### ✅ **Previous Improvements (v0.1.1)**

- ✅ **TypeScript API Migration**: From SWC to TypeScript Compiler API
- ✅ **Type Checker Integration**: SimpleTypeChecker provides accurate C++ type mappings
- ✅ **JSR.io Compatibility**: Now fully compatible with JSR publishing
- ✅ **Enhanced Type Support**: Generic types (Array<T>, Promise<T>), unions, intersections

### ✅ **Previous Improvements (v0.1.0)**

- ✅ Memory annotation support from JSDoc comments (@weak, @shared, @unique)
- ✅ Optional chaining detection and generation
- ✅ Runtime include path configuration via --runtime CLI option
- ✅ Fixed all compilation issues - generated code compiles successfully
- ✅ Updated GitHub Actions to use explicit permissions (no more -A flag)
- ✅ Fixed deprecated import usage in CLI

## Development

### Project Structure

```
typescript2cxx/
├── src/               # Transpiler source code
│   ├── cli.ts        # CLI entry point
│   ├── ast/          # TypeScript AST parser (using TypeScript API)
│   ├── ir/           # Intermediate representation
│   ├── transform/    # AST to C++ transformation
│   ├── codegen/      # C++ code generation
│   ├── memory/       # Memory analysis system
│   ├── plugins/      # Plugin system
│   ├── type-checker/ # TypeScript type checking integration
│   └── types.ts      # Core type definitions
├── runtime/          # C++ runtime library
│   └── core.h        # JavaScript-compatible C++ types
├── tests/            # Test suites
│   ├── specs/        # Specification tests
│   ├── fixtures/     # Test fixtures
│   └── unit/         # Unit tests
├── examples/         # Example transformations
└── docs/            # Documentation
```

### Running Tests

```bash
# Run all tests
deno task test

# Run specific test suite
deno task test:specs

# Watch mode
deno task test:watch

# Generate coverage
deno task coverage
```

### Building

```bash
# Type check
deno task check

# Format code
deno task fmt

# Lint
deno task lint

# Build executable
deno task compile
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install Deno 2.x
4. Run tests to verify setup
5. Make your changes
6. Submit a pull request

### Automated Workflows

- **CI** - Runs on all PRs and main branch pushes
- **Release** - Creates GitHub releases from version tags
- **JSR Publish** - Automatically publishes to JSR on version tags

See [RELEASE.md](docs/RELEASE.md) for the release process.

## Community

- [Discord Server](https://discord.gg/QbXn7Vqb) - Join #typescript2cxx channel
- [Issue Tracker](https://github.com/wowemulation-dev/typescript2cxx/issues)
- [Discussions](https://github.com/wowemulation-dev/typescript2cxx/discussions)

## Related Projects

- [warcraft-rs](https://github.com/wowemulation-dev/warcraft-rs) - Rust library for WoW file formats
- [TypeScript2Cxx](https://github.com/ASDAlexander77/TypeScript2Cxx) - Original inspiration for this project

## License

This project is licensed under either of

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT license ([LICENSE-MIT](LICENSE-MIT))

at your option.

## Acknowledgments

- Original TypeScript2Cxx project by ASDAlexander77
- WoW emulation community for requirements and feedback
- Deno team for the excellent runtime
