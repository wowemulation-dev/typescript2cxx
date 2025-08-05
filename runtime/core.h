#ifndef TYPESCRIPT2CXX_RUNTIME_CORE_H
#define TYPESCRIPT2CXX_RUNTIME_CORE_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <any>
#include <variant>
#include <optional>
#include <functional>
#include <sstream>

namespace js {

// String type with JavaScript-like behavior
class string {
public:
    std::string value;
    
    string() = default;
    string(const char* s) : value(s) {}
    string(const std::string& s) : value(s) {}
    
    operator std::string() const { return value; }
    const char* c_str() const { return value.c_str(); }
    
    // String operators
    string operator+(const string& other) const {
        return string(value + other.value);
    }
    
    bool operator==(const string& other) const {
        return value == other.value;
    }
    
    bool operator!=(const string& other) const {
        return value != other.value;
    }
    
    // String methods
    size_t length() const { return value.length(); }
    
    string slice(int start, int end = -1) const {
        if (end == -1) end = value.length();
        return string(value.substr(start, end - start));
    }
    
    string substring(int start, int end = -1) const {
        return slice(start, end);
    }
    
    // toString for compatibility
    string toString() const { return *this; }
};

// Stream operator for js::string
inline std::ostream& operator<<(std::ostream& os, const string& str) {
    return os << str.value;
}

// String literal operator
inline string operator""_S(const char* str, size_t) {
    return string(str);
}

// Number type (using double for JavaScript compatibility)
using number = double;

// Array type
template<typename T = std::any>
class array : public std::vector<T> {
public:
    using std::vector<T>::vector;
    
    // JavaScript-like array methods
    size_t length() const { return this->size(); }
    
    void push(const T& item) {
        this->push_back(item);
    }
    
    T pop() {
        T item = this->back();
        this->pop_back();
        return item;
    }
    
    template<typename Func>
    auto map(Func func) const {
        using ResultType = decltype(func(std::declval<T>()));
        array<ResultType> result;
        for (const auto& item : *this) {
            result.push(func(item));
        }
        return result;
    }
    
    template<typename Func>
    array<T> filter(Func func) const {
        array<T> result;
        for (const auto& item : *this) {
            if (func(item)) {
                result.push(item);
            }
        }
        return result;
    }
    
    template<typename Func, typename Acc>
    Acc reduce(Func func, Acc initial) const {
        Acc accumulator = initial;
        for (const auto& item : *this) {
            accumulator = func(accumulator, item);
        }
        return accumulator;
    }
};

// Object type (simplified)
using object = std::map<string, std::any>;

// Any type
using any = std::any;

// Undefined type
struct undefined_t {};
inline undefined_t undefined;

// Console object
class Console {
public:
    template<typename... Args>
    void log(Args... args) {
        ((std::cout << args << " "), ...);
        std::cout << std::endl;
    }
    
    template<typename... Args>
    void error(Args... args) {
        ((std::cerr << args << " "), ...);
        std::cerr << std::endl;
    }
};

inline Console console;

// Type conversion functions
inline string toString(const std::any& value) {
    // Simplified implementation
    if (value.type() == typeid(string)) {
        return std::any_cast<string>(value);
    } else if (value.type() == typeid(number)) {
        return string(std::to_string(std::any_cast<number>(value)));
    } else if (value.type() == typeid(bool)) {
        return string(std::any_cast<bool>(value) ? "true" : "false");
    }
    return string("[object Object]");
}

// typeof operator
inline string typeof_op(const std::any& value) {
    if (!value.has_value()) return "undefined";
    if (value.type() == typeid(string)) return "string";
    if (value.type() == typeid(number)) return "number";
    if (value.type() == typeid(bool)) return "boolean";
    return "object";
}

// delete operator (simplified)
inline bool delete_op(std::any&) {
    // In C++, we can't truly delete properties dynamically
    return true;
}

} // namespace js

#endif // TYPESCRIPT2CXX_RUNTIME_CORE_H