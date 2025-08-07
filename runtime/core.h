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
    
    // Iterators
    typename std::vector<T>::iterator begin() { return elements_.begin(); }
    typename std::vector<T>::iterator end() { return elements_.end(); }
    typename std::vector<T>::const_iterator begin() const { return elements_.begin(); }
    typename std::vector<T>::const_iterator end() const { return elements_.end(); }
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
    
    bool has(const std::string& key) const {
        return properties_.find(key) != properties_.end();
    }
};

// Console class
class Console {
public:
    template<typename... Args>
    void log(Args&&... args) {
        ((std::cout << args << " "), ...);
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
};

// Typedef for array<any> 
using array_any = array<any>;

// Implementation of string operator+ with any (after any is defined)
inline string string::operator+(const any& other) const {
    return string(value_ + other.toString().value());
}

// Global toString function for template literals
inline string toString(const string& s) { return s; }
inline string toString(const number& n) { return string(std::to_string(n.value_)); }
inline string toString(const any& a) { return a.toString(); }
inline string toString(bool b) { return string(b ? "true" : "false"); }
inline string toString(const char* s) { return string(s); }
template<typename T>
inline string toString(const T& value) {
    // Fallback for other types
    return string("[object]");
}

// Error types
class Error {
private:
    string message_;

public:
    Error(const string& msg) : message_(msg) {}
    const string& message() const { return message_; }
};

} // namespace js

#endif // TYPESCRIPT2CXX_RUNTIME_CORE_H