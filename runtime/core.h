#ifndef TYPESCRIPT2CXX_RUNTIME_CORE_H
#define TYPESCRIPT2CXX_RUNTIME_CORE_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <unordered_map>
#include <any>
#include <variant>
#include <optional>
#include <functional>
#include <sstream>
#include <algorithm>
#include <regex>
#include <chrono>
#include <ctime>
#include <cmath>
#include <random>
#include <iomanip>
#include <limits>
#include <stdexcept>

namespace js {

// Forward declarations for types that will use any
class any;

// Simple types first (no circular dependencies)

// Undefined and null types
struct undefined_t {
    bool operator==(const undefined_t&) const { return true; }
    bool operator!=(const undefined_t&) const { return false; }
};
inline undefined_t undefined;

struct null_t {
    bool operator==(const null_t&) const { return true; }
    bool operator!=(const null_t&) const { return false; }
    bool operator==(std::nullptr_t) const { return true; }
    bool operator!=(std::nullptr_t) const { return false; }
};
inline null_t null;

// Number type with comprehensive JavaScript semantics
class number {
public:
    double value_;

public:
    number() : value_(0.0) {}
    number(double v) : value_(v) {}
    number(int v) : value_(static_cast<double>(v)) {}
    number(const std::string& str) : value_(std::stod(str)) {}
    
    double value() const { return value_; }
    operator double() const { return value_; }
    
    // JavaScript number semantics
    bool isNaN() const { return std::isnan(value_); }
    bool isFinite() const { return std::isfinite(value_); }
    bool isInteger() const { return std::floor(value_) == value_; }
    
    // Arithmetic operators
    number operator+(const number& other) const { return number(value_ + other.value_); }
    number operator-(const number& other) const { return number(value_ - other.value_); }
    number operator*(const number& other) const { return number(value_ * other.value_); }
    number operator/(const number& other) const { return number(value_ / other.value_); }
    
    // Comparison operators
    bool operator==(const number& other) const { return value_ == other.value_; }
    bool operator!=(const number& other) const { return value_ != other.value_; }
    bool operator<(const number& other) const { return value_ < other.value_; }
    bool operator>(const number& other) const { return value_ > other.value_; }
    bool operator<=(const number& other) const { return value_ <= other.value_; }
    bool operator>=(const number& other) const { return value_ >= other.value_; }
    
    // Special JavaScript values
    static number NaN() { return number(std::numeric_limits<double>::quiet_NaN()); }
    static number Infinity() { return number(std::numeric_limits<double>::infinity()); }
    static number NegativeInfinity() { return number(-std::numeric_limits<double>::infinity()); }
};

// String class with JavaScript semantics
class string {
private:
    std::string value_;

public:
    string() = default;
    string(const std::string& str) : value_(str) {}
    string(const char* str) : value_(str) {}
    string(char ch) : value_(1, ch) {}
    
    const std::string& value() const { return value_; }
    operator std::string() const { return value_; }
    
    // JavaScript string methods
    size_t length() const { return value_.length(); }
    bool empty() const { return value_.empty(); }
    char charAt(size_t index) const { return index < value_.length() ? value_[index] : '\0'; }
    
    // String operators
    string operator+(const string& other) const { return string(value_ + other.value_); }
    string operator+(const number& other) const { return string(value_ + std::to_string(other.value_)); }
    string operator+(const any& other) const;
    string& operator+=(const string& other) { value_ += other.value_; return *this; }
    bool operator==(const string& other) const { return value_ == other.value_; }
    bool operator!=(const string& other) const { return value_ != other.value_; }
    
};

// String literal operator (must be in global namespace or js namespace)
inline string operator""_S(const char* str, size_t len) {
    return string(std::string(str, len));
}

// Stream operator for js::string
inline std::ostream& operator<<(std::ostream& os, const string& str) {
    return os << str.value();
}

// Stream operator for js::number
inline std::ostream& operator<<(std::ostream& os, const number& num) {
    return os << num.value();
}

// Forward declare template classes
template<typename T> class array;

// Simple array class (will be specialized for any later)
template<typename T>
class array {
private:
    std::vector<T> elements_;

public:
    array() = default;
    array(const std::vector<T>& elements) : elements_(elements) {}
    array(std::initializer_list<T> init) : elements_(init) {}
    
    // Basic array operations
    size_t length() const { return elements_.size(); }
    bool empty() const { return elements_.empty(); }
    
    T& operator[](size_t index) { return elements_[index]; }
    const T& operator[](size_t index) const { return elements_[index]; }
    
    void push(const T& value) { elements_.push_back(value); }
    T pop() { 
        T result = elements_.back(); 
        elements_.pop_back(); 
        return result; 
    }
    
    // Concat method for spread operations
    array<T> concat(const array<T>& other) const {
        array<T> result = *this;
        for (const auto& elem : other.elements_) {
            result.push(elem);
        }
        return result;
    }
    
    // Concat with single element (for [1, ...arr, 2] patterns)
    array<T> concat(const T& elem) const {
        array<T> result = *this;
        result.push(elem);
        return result;
    }
    
    // Iterators
    typename std::vector<T>::iterator begin() { return elements_.begin(); }
    typename std::vector<T>::iterator end() { return elements_.end(); }
    typename std::vector<T>::const_iterator begin() const { return elements_.begin(); }
    typename std::vector<T>::const_iterator end() const { return elements_.end(); }
    
    // Higher-order functions
    template<typename Func>
    auto map(Func&& func) const -> array<decltype(func(std::declval<T>()))> {
        using ResultType = decltype(func(std::declval<T>()));
        array<ResultType> result;
        for (const auto& elem : elements_) {
            result.push(func(elem));
        }
        return result;
    }
    
    template<typename Func>
    array<T> filter(Func&& func) const {
        array<T> result;
        for (const auto& elem : elements_) {
            if (func(elem)) {
                result.push(elem);
            }
        }
        return result;
    }
    
    template<typename Func, typename Init>
    auto reduce(Func&& func, Init&& init) const -> decltype(func(std::declval<Init>(), std::declval<T>())) {
        auto result = init;
        for (const auto& elem : elements_) {
            result = func(result, elem);
        }
        return result;
    }
    
    // Slice method for array destructuring rest elements
    array<T> slice(size_t start = 0) const {
        if (start >= elements_.size()) {
            return array<T>();
        }
        std::vector<T> sliced(elements_.begin() + start, elements_.end());
        return array<T>(sliced);
    }
    
    array<T> slice(size_t start, size_t end) const {
        if (start >= elements_.size()) {
            return array<T>();
        }
        size_t actualEnd = std::min(end, elements_.size());
        if (start >= actualEnd) {
            return array<T>();
        }
        std::vector<T> sliced(elements_.begin() + start, elements_.begin() + actualEnd);
        return array<T>(sliced);
    }
    
    // forEach method - executes a function for each element
    template<typename Func>
    void forEach(Func&& func) const {
        for (const auto& elem : elements_) {
            func(elem);
        }
    }
    
    // find method - returns first element that satisfies the predicate
    template<typename Func>
    T find(Func&& func) const {
        for (const auto& elem : elements_) {
            if (func(elem)) {
                return elem;
            }
        }
        return T(); // Return default value if not found
    }
    
    // findIndex method - returns index of first element that satisfies the predicate
    template<typename Func>
    int findIndex(Func&& func) const {
        for (size_t i = 0; i < elements_.size(); ++i) {
            if (func(elements_[i])) {
                return static_cast<int>(i);
            }
        }
        return -1; // Return -1 if not found
    }
    
    // some method - tests whether at least one element passes the test
    template<typename Func>
    bool some(Func&& func) const {
        for (const auto& elem : elements_) {
            if (func(elem)) {
                return true;
            }
        }
        return false;
    }
    
    // every method - tests whether all elements pass the test
    template<typename Func>
    bool every(Func&& func) const {
        for (const auto& elem : elements_) {
            if (!func(elem)) {
                return false;
            }
        }
        return true;
    }
    
    // includes method - checks if array includes a certain value
    bool includes(const T& value) const {
        for (const auto& elem : elements_) {
            if (elem == value) {
                return true;
            }
        }
        return false;
    }
};

// Object class for JavaScript objects
class object {
private:
    // Use std::any to store any type of value
    std::unordered_map<std::string, std::any> properties_;
    std::shared_ptr<object> prototype_;

public:
    object() = default;
    
    // Property access
    template<typename T>
    void set(const std::string& key, const T& value) {
        properties_[key] = value;
    }
    
    template<typename T>
    T get(const std::string& key) const {
        auto it = properties_.find(key);
        if (it != properties_.end()) {
            return std::any_cast<T>(it->second);
        }
        throw std::runtime_error("Property not found: " + key);
    }
    
    // Declaration only - implementation will be after 'any' class is defined
    any get_as_js_any(const std::string& key) const;
    
    bool has(const std::string& key) const {
        return properties_.find(key) != properties_.end();
    }
    
    // Get all entries as a range for iteration
    const std::unordered_map<std::string, std::any>& entries() const {
        return properties_;
    }
};

// Console class
class Console {
public:
    template<typename... Args>
    void log(Args&&... args) {
        if constexpr (sizeof...(args) == 1) {
            ((std::cout << args), ...);
        } else {
            ((std::cout << args << " "), ...);
        }
        std::cout << std::endl;
    }
    
    template<typename... Args>
    void error(Args&&... args) {
        ((std::cerr << args << " "), ...);
        std::cerr << std::endl;
    }
};

// Global console instance
inline Console console;

// Now define the any type after all other types are complete
class any {
private:
    std::variant<
        undefined_t,
        null_t,
        bool,
        number,
        string,
        array<any>,          // Now array<any> is complete
        object
    > value_;

public:
    // Constructors
    any() : value_(undefined) {}
    any(const undefined_t& val) : value_(val) {}
    any(const null_t& val) : value_(val) {}
    any(bool val) : value_(val) {}
    any(const number& val) : value_(val) {}
    any(double val) : value_(number(val)) {}
    any(int val) : value_(number(val)) {}
    any(const string& val) : value_(val) {}
    any(const char* val) : value_(string(val)) {}
    any(const array<any>& val) : value_(val) {}
    any(const object& val) : value_(val) {}
    
    // Support for typed arrays (converts array<T> to array<any>)
    template<typename T>
    any(const array<T>& val) {
        array<any> converted;
        for (size_t i = 0; i < val.length(); i++) {
            converted.push(any(val[i]));
        }
        value_ = converted;
    }
    
    // Copy and move constructors
    any(const any& other) = default;
    any(any&& other) = default;
    any& operator=(const any& other) = default;
    any& operator=(any&& other) = default;

    // Type checking
    template<typename T>
    bool is() const {
        return std::holds_alternative<T>(value_);
    }

    // Value access
    template<typename T>
    T get() const {
        return std::get<T>(value_);
    }
    
    template<typename T>
    T as() const {
        return get<T>();
    }

    // Convert to string for concatenation
    string toString() const {
        if (is<string>()) return get<string>();
        if (is<number>()) return string(std::to_string(get<number>().value_));
        if (is<bool>()) return string(get<bool>() ? "true" : "false");
        if (is<null_t>()) return string("null");
        if (is<undefined_t>()) return string("undefined");
        return string("[object]");
    }

    // Conversion operators
    explicit operator bool() const {
        if (is<bool>()) return get<bool>();
        if (is<number>()) return get<number>().value() != 0.0;
        if (is<string>()) return !get<string>().empty();
        if (is<undefined_t>() || is<null_t>()) return false;
        return true;
    }

    // Get variant for direct access when needed
    const auto& variant() const { return value_; }
    auto& variant() { return value_; }
    
    // Property access for objects
    any operator[](const string& key) const {
        if (is<object>()) {
            const auto& obj = get<object>();
            const std::string keyStr = key.value(); 
            if (obj.has(keyStr)) {
                return obj.get_as_js_any(keyStr);
            }
        }
        return undefined;
    }
    
    // Property access for objects with numeric keys
    any operator[](const number& key) const {
        if (is<object>()) {
            const auto& obj = get<object>();
            // Convert number to JavaScript-style string (integers without decimals)
            double val = key.value();
            std::string keyStr;
            if (val == std::floor(val) && std::isfinite(val)) {
                // Integer value - convert without decimal
                keyStr = std::to_string(static_cast<long long>(val));
            } else {
                // Floating point value - use standard conversion
                keyStr = std::to_string(val);
            }
            if (obj.has(keyStr)) {
                return obj.get_as_js_any(keyStr);
            }
        }
        return undefined;
    }
    
    // Property access for objects with integer keys (common case)
    any operator[](int key) const {
        return (*this)[number(key)];
    }
    
    // Slice method for array destructuring rest elements
    any slice(int start = 0) const {
        // If this contains an array, delegate to its slice method
        if (is<array<any>>()) {
            return any(get<array<any>>().slice(static_cast<size_t>(std::max(0, start))));
        }
        // Return empty array for non-arrays
        return any(array<any>());
    }
    
    any slice(int start, int end) const {
        // If this contains an array, delegate to its slice method
        if (is<array<any>>()) {
            return any(get<array<any>>().slice(
                static_cast<size_t>(std::max(0, start)),
                static_cast<size_t>(std::max(0, end))
            ));
        }
        // Return empty array for non-arrays
        return any(array<any>());
    }
    
    // Arithmetic operators for JavaScript-like operations
    any operator+(const any& other) const {
        // Number + Number -> Number
        if (is<number>() && other.is<number>()) {
            return any(number(get<number>().value() + other.get<number>().value()));
        }
        // String + any -> String (concatenation)
        if (is<string>()) {
            return any(get<string>() + other.toString());
        }
        // any + String -> String (concatenation)
        if (other.is<string>()) {
            return any(toString() + other.get<string>());
        }
        // Convert both to numbers and add
        if (is<number>() || other.is<number>()) {
            double leftVal = is<number>() ? get<number>().value() : 0.0;
            double rightVal = other.is<number>() ? other.get<number>().value() : 0.0;
            return any(number(leftVal + rightVal));
        }
        return undefined;
    }
    
    any operator+(const number& other) const {
        if (is<number>()) {
            return any(number(get<number>().value() + other.value()));
        }
        if (is<string>()) {
            return any(get<string>() + string(std::to_string(other.value())));
        }
        return undefined;
    }
    
    any operator+(const string& other) const {
        return any(toString() + other);
    }
    
    // Arithmetic operators with numbers
    any operator*(const number& other) const {
        if (is<number>()) {
            return any(number(get<number>().value() * other.value()));
        }
        return undefined;
    }
    
    any operator/(const number& other) const {
        if (is<number>()) {
            return any(number(get<number>().value() / other.value()));
        }
        return undefined;
    }
    
    any operator-(const number& other) const {
        if (is<number>()) {
            return any(number(get<number>().value() - other.value()));
        }
        return undefined;
    }
    
    any operator%(const number& other) const {
        if (is<number>()) {
            return any(number(std::fmod(get<number>().value(), other.value())));
        }
        return undefined;
    }
    
    // Comparison operators
    bool operator>(const number& other) const {
        if (is<number>()) {
            return get<number>().value() > other.value();
        }
        return false;
    }
    
    bool operator<(const number& other) const {
        if (is<number>()) {
            return get<number>().value() < other.value();
        }
        return false;
    }
    
    bool operator>=(const number& other) const {
        if (is<number>()) {
            return get<number>().value() >= other.value();
        }
        return false;
    }
    
    bool operator<=(const number& other) const {
        if (is<number>()) {
            return get<number>().value() <= other.value();
        }
        return false;
    }
    
    bool operator==(const number& other) const {
        if (is<number>()) {
            return get<number>().value() == other.value();
        }
        return false;
    }
    
    bool operator!=(const number& other) const {
        if (is<number>()) {
            return get<number>().value() != other.value();
        }
        return true;
    }
    
    // Property assignment for objects - this method should not be used directly
    // Use explicit assignment through the object reference instead
    
    // Array methods - delegate to underlying array if this contains an array
    template<typename Func>
    auto map(Func&& func) const {
        if (is<array<any>>()) {
            return get<array<any>>().map(std::forward<Func>(func));
        }
        return array<any>(); // Return empty array for non-arrays
    }
    
    template<typename Func>
    auto filter(Func&& func) const {
        if (is<array<any>>()) {
            return get<array<any>>().filter(std::forward<Func>(func));
        }
        return array<any>(); // Return empty array for non-arrays
    }
    
    template<typename Func, typename Init>
    auto reduce(Func&& func, Init&& init) const {
        if (is<array<any>>()) {
            return get<array<any>>().reduce(std::forward<Func>(func), std::forward<Init>(init));
        }
        return init; // Return initial value for non-arrays
    }
    
    template<typename Func>
    void forEach(Func&& func) const {
        if (is<array<any>>()) {
            get<array<any>>().forEach(std::forward<Func>(func));
        }
    }
    
    template<typename Func>
    any find(Func&& func) const {
        if (is<array<any>>()) {
            return get<array<any>>().find(std::forward<Func>(func));
        }
        return undefined; // Return undefined for non-arrays
    }
    
    template<typename Func>
    number findIndex(Func&& func) const {
        if (is<array<any>>()) {
            return number(get<array<any>>().findIndex(std::forward<Func>(func)));
        }
        return number(-1); // Return -1 for non-arrays
    }
    
    template<typename Func>
    bool some(Func&& func) const {
        if (is<array<any>>()) {
            return get<array<any>>().some(std::forward<Func>(func));
        }
        return false; // Return false for non-arrays
    }
    
    template<typename Func>
    bool every(Func&& func) const {
        if (is<array<any>>()) {
            return get<array<any>>().every(std::forward<Func>(func));
        }
        return true; // Return true for non-arrays (vacuous truth)
    }
    
    bool includes(const any& value) const {
        if (is<array<any>>()) {
            return get<array<any>>().includes(value);
        }
        return false; // Return false for non-arrays
    }
    
    // As object for iteration  
    object as_object() const {
        if (is<object>()) {
            return get<object>();
        }
        return object(); // Return empty object for non-objects
    }
};

// Typedef for array<any> 
using array_any = array<any>;

// Implementation of string operator+ with any (after any is defined)
inline string string::operator+(const any& other) const {
    return string(value_ + other.toString().value());
}

// Global toString function for template literals
inline string toString(const string& s) { return s; }
inline string toString(const number& n) { 
    double val = n.value();
    if (val == std::floor(val) && std::isfinite(val)) {
        // Integer value - convert without decimal
        return string(std::to_string(static_cast<long long>(val)));
    } else {
        // Floating point value - use standard conversion
        return string(std::to_string(val));
    }
}
inline string toString(const any& a) { return a.toString(); }
inline string toString(bool b) { return string(b ? "true" : "false"); }
inline string toString(const char* s) { return string(s); }
template<typename T>
inline string toString(const T& value) {
    // Fallback for other types
    return string("[object]");
}

// Stream operator for console.log support with js::any
inline std::ostream& operator<<(std::ostream& os, const js::any& value) {
    return os << value.toString();
}

// Error types
class Error {
private:
    string message_;

public:
    Error(const string& msg) : message_(msg) {}
    const string& message() const { return message_; }
};

// Implementation of object::get_as_js_any (after any class is defined)
inline any object::get_as_js_any(const std::string& key) const {
    auto it = properties_.find(key);
    if (it != properties_.end()) {
        const std::any& stored_value = it->second;
        
        // Try to cast to various js types and convert to js::any
        try {
            if (const auto* val = std::any_cast<string>(&stored_value)) {
                return any(*val);
            }
            if (const auto* val = std::any_cast<number>(&stored_value)) {
                return any(*val);
            }
            if (const auto* val = std::any_cast<bool>(&stored_value)) {
                return any(*val);
            }
            if (const auto* val = std::any_cast<any>(&stored_value)) {
                return *val;
            }
            if (const auto* val = std::any_cast<object>(&stored_value)) {
                return any(*val);
            }
            if (const auto* val = std::any_cast<undefined_t>(&stored_value)) {
                return any(*val);
            }
            if (const auto* val = std::any_cast<null_t>(&stored_value)) {
                return any(*val);
            }
            // Add more type conversions as needed
            return undefined;
        } catch (...) {
            return undefined;
        }
    }
    return undefined;
}

} // namespace js

// Include type guards for logical operators and runtime checks
#include "type_guards.h"

#endif // TYPESCRIPT2CXX_RUNTIME_CORE_H