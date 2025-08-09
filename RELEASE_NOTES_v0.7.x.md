# Release Notes - v0.7.x Series

## Version 0.7.0 - Arrow Functions and Array Methods (2025-01-14)

Major update introducing arrow functions and comprehensive array higher-order methods support.

### Added

#### Arrow Functions
- Full arrow function support with lambda generation
- Lexical `this` binding with capture modes
- Single expression and block body syntax
- Type inference for arrow function parameters
- Proper return type deduction

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

This release represents significant progress in JavaScript feature parity, bringing modern array operations and arrow functions to the C++ transpilation.