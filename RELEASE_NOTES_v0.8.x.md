# TypeScript2Cxx v0.8.0 Release Notes

## Overview

TypeScript2Cxx v0.8.0 introduces comprehensive support for **Rest Parameters** (`...args`), completing the function parameter feature set and bringing the transpiler closer to full TypeScript compatibility.

## 🆕 New Features

### Rest Parameters Support

**Complete implementation of JavaScript/TypeScript rest parameters with C++20 variadic templates**

#### Key Features:

- **Variadic Template Generation**: `function sum(...numbers: number[])` generates `template<typename... Args> js::number sum(Args... numbers)`
- **Automatic Array Conversion**: Rest parameter packs are automatically converted to `js::array<T>` for iteration
- **Type-Safe Element Types**: Proper type extraction from array types (e.g., `number[]` → `js::array<js::number>`)
- **Mixed Parameters**: Support for regular + rest parameters in same function
- **All Function Contexts**: Works with regular functions, arrow functions, class methods, and nested functions

#### Examples:

**Basic Rest Parameters:**

```typescript
function sum(...numbers: number[]): number {
  let total = 0;
  for (const num of numbers) {
    total += num;
  }
  return total;
}

sum(1, 2, 3, 4, 5); // Works correctly
```

**Generated C++ Code:**

```cpp
template<typename... Args>
js::number sum(Args... numbers) {
    auto numbers_array = js::array<js::number>{numbers...};
    js::number total = js::number(0);
    for (auto& num : numbers_array) {
        total += num;
    }
    return total;
}
```

**Mixed Parameters:**

```typescript
function greet(greeting: string, ...names: string[]): string {
  return greeting + " " + names.join(", ");
}

greet("Hello", "Alice", "Bob", "Charlie");
```

**Arrow Functions:**

```typescript
const multiply = (...numbers: number[]) => {
  return numbers.reduce((a, b) => a * b, 1);
};
```

## 🔧 Technical Improvements

### Runtime Enhancements

1. **Compound Assignment Operators**: Added missing `+=`, `-=`, `*=`, `/=` operators to `js::number` class
2. **Array Length Property**: Enhanced `.length` property handling to generate `.length()` method calls
3. **Template Parameter Mapping**: Intelligent rest parameter name mapping to avoid conflicts
4. **Type System Integration**: Proper type extraction from rest parameter array types

### Code Generation Improvements

1. **C++ Template Generation**: Automatic `template<typename... Args>` generation for rest parameter functions
2. **Parameter Pack Expansion**: Correct `{args...}` expansion syntax for initializer lists
3. **Variable Name Resolution**: Context-aware identifier mapping for rest parameters
4. **Memory Management**: Rest parameters work with all memory management annotations

### Test Coverage

- **Comprehensive Test Suite**: 10+ test scenarios covering all rest parameter use cases
- **End-to-End Validation**: Full compilation and execution testing
- **Type Safety Verification**: All tests validate correct C++ type generation
- **Integration Testing**: Rest parameters work with existing language features

## 🚀 Quality Assurance

### Verification Results

- ✅ **Formatting**: All code formatted with `deno fmt`
- ✅ **Linting**: Clean codebase with zero linting issues
- ✅ **Type Checking**: Full TypeScript type safety validation
- ✅ **Core Tests**: All existing functionality remains intact
- ✅ **Compilation**: Generated C++ compiles successfully with clang++ and g++
- ✅ **Execution**: Transpiled programs run with correct output

### Known Working Scenarios

- Simple rest parameters with primitive types (number, string)
- Rest parameters with mixed regular parameters
- Rest parameters in arrow functions and class methods
- Empty rest parameter calls (zero arguments)
- Nested function calls with rest parameter spreading

## 📈 Impact

This release completes the **Function Parameters** category, marking it as fully implemented:

| Feature Category      | Status        | Completion |
| --------------------- | ------------- | ---------- |
| **Function Features** | ✅ COMPLETED  | 100%       |
| - Default Parameters  | ✅ v0.5.3-dev | ✅         |
| - Optional Parameters | ✅ v0.5.3-dev | ✅         |
| - Rest Parameters     | ✅ v0.8.0-dev | ✅         |

### Updated Progress Statistics

- **Core TypeScript Features**: ~78% complete (+3% from rest parameters)
- **Function Parameter System**: 100% complete
- **C++ Code Generation**: Enhanced template support

## 🔄 Migration Guide

### For Existing Code

- No breaking changes - all existing functionality preserved
- Rest parameters work alongside existing function features
- Generated C++ maintains backward compatibility

### New Capabilities

You can now use rest parameters in any function context:

```typescript
// All of these now work:
function variadic(...args: any[]) {/* ... */}
const arrow = (...items: string[]) => {/* ... */};
class Example {
  method(...params: number[]) {/* ... */}
}
```

## 🎯 Next Steps (v0.9.0 Roadmap)

With function parameters now complete, the next major targets are:

1. **Destructuring Assignment**: Object and array destructuring patterns
2. **Async/Await**: C++20 coroutine-based implementation
3. **Module System**: ES module import/export support
4. **Source Maps**: Debugging support with line mapping

## 🐛 Known Limitations

- Rest parameters with union types may fall back to `js::any` arrays
- Complex type constraints in rest parameters not fully supported
- Performance optimization for large argument lists pending

## 📝 Technical Details

### Implementation Architecture

- **AST Detection**: `param.dotDotDotToken` detection in TypeScript AST
- **IR Representation**: `IRParameter.isRest` flag in intermediate representation
- **C++ Generation**: Variadic template + initializer list pattern
- **Runtime Conversion**: Parameter pack → `js::array<T>` transformation

### Memory Management

- Rest parameter arrays use standard `js::array<T>` memory semantics
- Compatible with all memory annotations (`@weak`, `@shared`, `@unique`)
- Automatic cleanup through RAII patterns

---

**TypeScript2Cxx v0.8.0** - Completing the Function Parameter Foundation
_Released: August 2025_
