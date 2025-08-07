# Release Notes - v0.3.x Series

## Version 0.3.0 - Complete JavaScript Runtime Library

_Released: 2025-01-06_

### Overview

Version 0.3.0 delivered a comprehensive JavaScript runtime library implementation, providing full compatibility with JavaScript's built-in types and standard objects. This release represents a major milestone in achieving JavaScript semantics in C++.

### Major Features

#### Core Runtime Types

- **js::string**: Complete implementation with 30+ methods
  - Character access: charAt, charCodeAt, codePointAt
  - Substring operations: substring, substr, slice
  - Case conversion: toLowerCase, toUpperCase, toLocaleLowerCase, toLocaleUpperCase
  - Trimming: trim, trimStart, trimEnd
  - Search and replace: indexOf, lastIndexOf, search, match, replace, replaceAll
  - Testing: startsWith, endsWith, includes
  - Padding and repeating: padStart, padEnd, repeat
  - Template literals: String.raw support

- **js::number**: Full IEEE 754 double implementation
  - Formatting: toString, toFixed, toExponential, toPrecision
  - Parsing: parseInt, parseFloat with radix support
  - Validation: isNaN, isFinite, isInteger, isSafeInteger
  - Constants: EPSILON, MAX_VALUE, MIN_VALUE, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER
  - Special values: NaN, Infinity, -Infinity

- **js::array<T>**: Complete array implementation
  - Mutating methods: push, pop, shift, unshift, splice, sort, reverse, fill
  - Non-mutating: slice, concat, join, toString, toLocaleString
  - Iteration: forEach, map, filter, reduce, reduceRight, find, findIndex
  - Testing: every, some, includes, indexOf, lastIndexOf
  - ES6+ features: from, of, entries, keys, values, flat, flatMap

- **js::object**: Dynamic object with prototype chain
  - Property access and modification
  - Prototype-based inheritance
  - Object.keys, Object.values, Object.entries
  - Object.assign, Object.create
  - Property descriptors

- **js::any**: Variant type for dynamic typing
  - Type-safe union of all JavaScript types
  - Automatic type conversions
  - Runtime type checking

#### Standard JavaScript Objects

- **Math Object**: Complete implementation
  - Trigonometric: sin, cos, tan, asin, acos, atan, atan2
  - Logarithmic: log, log10, log2, log1p
  - Exponential: exp, expm1, pow, sqrt, cbrt
  - Rounding: floor, ceil, round, trunc
  - Utilities: abs, sign, min, max, random, hypot, imul, clz32
  - Constants: E, LN2, LN10, LOG2E, LOG10E, PI, SQRT1_2, SQRT2

- **Date Object**: Full date/time support
  - Constructors for various date formats
  - Getters: getFullYear, getMonth, getDate, getHours, etc.
  - Setters: setFullYear, setMonth, setDate, setHours, etc.
  - Formatting: toString, toISOString, toJSON, toDateString, toTimeString
  - Static methods: now, parse, UTC

- **RegExp Object**: Regular expression support
  - Pattern matching with flags (g, i, m, s, u, y)
  - Methods: test, exec, toString
  - Integration with string methods

- **JSON Object**: Serialization support
  - stringify with replacer and space parameters
  - parse with reviver function
  - Proper handling of circular references
  - Date serialization support

- **Console Object**: Debugging utilities
  - Output methods: log, error, warn, info, debug
  - Formatting: table, dir, dirxml
  - Timing: time, timeEnd, timeLog
  - Grouping: group, groupCollapsed, groupEnd
  - Utilities: assert, count, countReset, clear, trace

#### Error System

- **Error Hierarchy**: Complete error class system
  - Base Error class with message and stack
  - TypeError for type-related errors
  - ReferenceError for undefined references
  - SyntaxError for parsing errors
  - RangeError for numeric range violations
  - Stack trace generation

#### Global Functions

- **Type Conversion**: parseInt, parseFloat with full spec compliance
- **Validation**: isNaN, isFinite for number checking
- **URI Encoding**: encodeURI, decodeURI, encodeURIComponent, decodeURIComponent

### Code Generation Improvements

- Enhanced type mapping for runtime types
- Proper namespace resolution for js:: types
- Improved literal generation for special values
- Better handling of method calls on built-in types
- Optimized code generation for common patterns

### Memory Management

- Smart pointer optimization for runtime types
- Efficient string interning
- Optimized array storage
- Reference counting for shared objects
- Automatic cleanup of temporary objects

### Testing & Quality

- 50+ new test cases for runtime features
- Complete test coverage for all runtime methods
- Integration tests for complex scenarios
- Performance benchmarks for critical operations
- Memory leak detection and prevention

### Breaking Changes

- All JavaScript types now use js:: namespace
- Changed string literal syntax to use _S suffix
- Modified array initialization syntax
- Updated object property access patterns

### Performance

- String operations optimized with C++17 features
- Array methods use efficient STL algorithms
- Object property access via unordered_map
- Lazy evaluation for expensive operations
- Copy-on-write for string operations

### Bug Fixes

- Fixed string concatenation memory leaks
- Resolved array index out-of-bounds issues
- Corrected Math function precision problems
- Fixed Date timezone handling
- Resolved JSON circular reference detection

---

## Version 0.3.1 - Runtime Stability & Polish

_Released: 2025-01-08_

### Improvements

- Enhanced runtime performance by 25%
- Better error messages from runtime functions
- Improved compatibility with JavaScript semantics
- Optimized memory usage for large arrays

### Bug Fixes

- Fixed edge cases in string.split()
- Resolved array.sort() stability issues
- Corrected Date parsing for ISO strings
- Fixed Math.random() distribution

### Documentation

- Complete runtime API reference
- Migration guide for runtime types
- Performance tuning guide
- Best practices for memory management
