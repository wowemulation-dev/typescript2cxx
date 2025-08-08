# Release Notes - v0.6.x Series

## Version 0.6.0 - Modern JavaScript Operators & Enhanced Language Support

_Released: 2025-01-08_

### Overview

Version 0.6.0 represents a significant milestone in TypeScript2Cxx's evolution, delivering comprehensive support for modern JavaScript operators and enhanced destructuring capabilities. This release focuses on closing the gap with contemporary JavaScript/TypeScript language features, making the transpiler more capable of handling modern codebases.

### Major Features

#### Modern JavaScript Operators Support

- **Exponentiation Operator (**)**: Full support for power operations
  - Transpiled to `std::pow()` with automatic `<cmath>` inclusion
  - Supports all numeric types: integers, decimals, negatives
  - Handles nested expressions: `2 ** (3 ** 2)`
  - Complex expressions: `a ** b + b ** a`

- **Numeric Separators (1_000_000)**: Enhanced code readability
  - Integer literals: `1_000_000` → `1000000`
  - Decimal literals: `3.141_592_653` → `3.141592653`
  - Binary literals: `0b1010_0001` → `161`
  - Hex literals: `0xFF_EC` → `65516`

#### Enhanced Object & Array Features

- **Improved Destructuring Assignment**:
  - **Fixed duplicate declarations**: Destructuring code now only generated in source files
  - **Array slice support**: Added `slice()` method to `js::array` for rest elements
  - **Enhanced js::any slice**: Full slice support for any type containing arrays
  - Object destructuring: `const { a, b } = obj`
  - Array destructuring with rest: `const [first, ...rest] = arr`

- **Advanced Spread Operator Support**:
  - **Array concatenation**: Full `concat()` method implementation
  - **Empty array handling**: Fixed template deduction with explicit `js::array<js::any>{}`
  - **Complex patterns**: `[0, ...arr1, 999, ...arr2, 1000]`
  - **Nested spreads**: `[...[...arr1, 2], 3]`
  - **Multiple spreads**: `[...single, ...single, ...single]`

#### Runtime Library Enhancements

- **Enhanced js::array Methods**:
  - `concat(const array<T>& other)` - concatenate arrays
  - `concat(const T& elem)` - append single elements
  - `slice(size_t start = 0)` - array slicing from start
  - `slice(size_t start, size_t end)` - array slicing with range

- **js::any Improvements**:
  - `slice(int start = 0)` - delegate to contained array
  - `slice(int start, int end)` - range slicing support
  - Better type detection for array operations

### Language Support Improvements

#### Type System Enhancements

- **BinaryOp Type Extension**: Added `"**"` to supported binary operators
- **Proper Operator Mapping**: Exponentiation now correctly mapped instead of falling back to addition
- **Include Management**: Automatic header inclusion for required system libraries

#### Code Generation Quality

- **Empty Array Fix**: Template deduction issues resolved for empty array literals
- **Consistent Formatting**: All generated code follows project style guidelines
- **Memory Safety**: Proper bounds checking in slice operations

### Developer Experience

#### Testing & Quality Assurance

- **Comprehensive Test Coverage**: 16 new test cases across 3 feature areas
  - Spread Operator: 5 test cases covering all usage patterns
  - Numeric Separators: 5 test cases covering all literal types
  - Exponentiation Operator: 6 test cases covering all expression types

- **Enhanced Pre-Release QA**: Automated quality checks ensure:
  - Code formatting compliance
  - TypeScript type checking
  - ESLint rule compliance
  - Core functionality verification

#### Documentation Improvements

- **Updated Feature Matrix**: TODO.md reflects new v0.6.0 capabilities
- **Comprehensive Specs**: Detailed test specifications for all new features
- **Release Process**: Improved versioning and release management

### Technical Details

#### Compiler Integration

- **TypeScript Compatibility**: Leverages TypeScript compiler's numeric separator parsing
- **C++20 Standards**: All generated code compatible with modern C++ standards
- **Math Library Integration**: Automatic `<cmath>` inclusion for mathematical operations

#### Performance Optimizations

- **Efficient Array Operations**: Spread operations use vector-based concatenation
- **Minimal Memory Overhead**: Slice operations create efficient sub-arrays
- **Smart Include Management**: Only necessary headers are included

### Backward Compatibility

All existing functionality remains fully compatible. New features are additive and do not break existing transpiled code.

### Migration Notes

No migration required for existing projects. New features are automatically available when upgrading to v0.6.0.

### Known Limitations

- **Function Call Spread Arguments**: `func(...args)` pattern not yet fully implemented
- **BigInt Literals**: `123n` syntax support pending for future releases

### Contributors

This release was developed with AI assistance using Claude Code, demonstrating the power of AI-assisted software development.

---

**Full Changelog**: See [CHANGELOG.md](./CHANGELOG.md) for detailed commit history.

**Previous Release**: [v0.5.3](./RELEASE_NOTES_v0.5.x.md)
