# Release Notes - v0.7.x Series

## Version 0.7.0 - Modern JavaScript Operators and Functions (2025-01-08)

Major update introducing modern JavaScript operators, arrow functions, IIFE support, and comprehensive array higher-order methods.

### Added

#### Arrow Functions

- Full arrow function support with lambda generation
- Lexical `this` binding with capture modes
- Single expression and block body syntax
- Type inference for arrow function parameters
- Proper return type deduction

#### Modern JavaScript Operators

- **Computed Property Names** - Dynamic object keys (`{[key]: value}`)
- **IIFE Support** - Immediately Invoked Function Expressions with lambda wrappers
- **instanceof operator** - Runtime type checking with prototype chain traversal
- **in operator** - Property existence checking for objects and arrays
- **delete operator** - Property deletion with boolean return values

#### Array Higher-Order Methods

- `forEach()` - Execute function for each element
- `find()` - Find first element matching predicate
- `findIndex()` - Find index of first matching element
- `some()` - Test if at least one element matches
- `every()` - Test if all elements match
- `includes()` - Check if array contains value
- Enhanced `map()`, `filter()`, `reduce()` with js::any support

#### Destructuring Enhancements

- Object rest properties (`const { a, ...rest } = obj`)
- Array rest elements (`const [first, ...rest] = arr`)
- Lambda-wrapped rest object generation for global scope
- Proper entries() method for object iteration

#### Spread Operator

- Array spread in array literals (`[...arr1, ...arr2]`)
- Concatenation support for spread operations
- Empty array handling with explicit type specification

### Fixed

#### Code Generation

- C++ reserved keywords now properly escaped with underscore suffix
- Variable names checked against full C++ keyword list
- Fixed object rest properties at global scope using lambda wrappers
- Corrected === and !== operator mapping to == and !=
- Added computed property name generation (`{[expr]: value}`)
- IIFE lambda wrapper generation for immediate execution
- Runtime helper function calls for instanceof, in, and delete operators

#### Runtime Library

- Added missing arithmetic operators to js::any (*, /, -, %)
- Added comparison operators to js::any (>, <, >=, <=, ==, !=)
- Added operator overloads for js::any with js::number
- Enhanced js::any to delegate array methods to underlying arrays
- Added entries() method to js::object for iteration

### Enhanced

#### Developer Experience

- Better array method detection in code generator
- Improved identifier mapping for reserved words
- More comprehensive operator support in runtime
- Cleaner lambda generation for complex patterns

### Technical Details

#### Runtime Additions

```cpp
// New array methods in js::array<T>
template<typename Func> void forEach(Func&& func) const;
template<typename Func> T find(Func&& func) const;
template<typename Func> int findIndex(Func&& func) const;
template<typename Func> bool some(Func&& func) const;
template<typename Func> bool every(Func&& func) const;
bool includes(const T& value) const;

// New operators in js::any
any operator*(const number& other) const;
any operator/(const number& other) const;
any operator-(const number& other) const;
any operator%(const number& other) const;
bool operator>(const number& other) const;
bool operator<(const number& other) const;
bool operator>=(const number& other) const;
bool operator<=(const number& other) const;
bool operator==(const number& other) const;
bool operator!=(const number& other) const;

// New runtime helper functions
bool js_instanceof(const js::any& obj, const js::any& constructor);
bool js_in(const std::string& prop, const js::any& obj);
bool js_delete(js::any& obj, const std::string& prop);

// Enhanced object methods
std::vector<std::pair<std::string, js::any>> entries() const;
```

#### Breaking Changes

None - All changes are additive or bug fixes.

### Known Limitations

- Lambda functions cannot be directly stored as js::any (need std::function wrapper)
- Some complex arrow function patterns may require manual adjustment
- Object rest iteration requires C++17 structured bindings

### Migration Guide

No migration required. Existing code continues to work with enhanced functionality available.

### Contributors

This release represents significant progress in JavaScript feature parity, bringing modern array operations, arrow functions, IIFE support, and essential JavaScript operators (instanceof, in, delete) to the C++ transpilation. With computed property names and comprehensive operator support, v0.7.0 enables more dynamic and idiomatic JavaScript patterns in C++ output.
