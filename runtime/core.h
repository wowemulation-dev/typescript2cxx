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
#include <iomanip>
#include <random>
#include <limits>
#include <stdexcept>
#include <algorithm>
#include <cctype>
#include <sstream>
#include <atomic>
#include <unordered_map>

namespace js {

// Forward declarations for types that will use any
class any;
class Date;
class Error;

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
    
    // Compound assignment operators
    number& operator+=(const number& other) { value_ += other.value_; return *this; }
    number& operator-=(const number& other) { value_ -= other.value_; return *this; }
    number& operator*=(const number& other) { value_ *= other.value_; return *this; }
    number& operator/=(const number& other) { value_ /= other.value_; return *this; }
    
    // Increment/decrement operators
    number& operator++() { ++value_; return *this; }     // prefix ++
    number operator++(int) { number temp(*this); ++value_; return temp; }  // postfix ++
    number& operator--() { --value_; return *this; }     // prefix --
    number operator--(int) { number temp(*this); --value_; return temp; }  // postfix --
    
    // Comparison operators
    bool operator==(const number& other) const { return value_ == other.value_; }
    bool operator!=(const number& other) const { return value_ != other.value_; }
    bool operator<(const number& other) const { return value_ < other.value_; }
    bool operator>(const number& other) const { return value_ > other.value_; }
    bool operator<=(const number& other) const { return value_ <= other.value_; }
    bool operator>=(const number& other) const { return value_ >= other.value_; }
    
    // Comparison with size_t (for array.length() comparisons)
    bool operator<(size_t other) const { return value_ < static_cast<double>(other); }
    bool operator>(size_t other) const { return value_ > static_cast<double>(other); }
    bool operator<=(size_t other) const { return value_ <= static_cast<double>(other); }
    bool operator>=(size_t other) const { return value_ >= static_cast<double>(other); }
    bool operator==(size_t other) const { return value_ == static_cast<double>(other); }
    bool operator!=(size_t other) const { return value_ != static_cast<double>(other); }
    
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
    
    // String utility methods
    string trim() const {
        std::string result = value_;
        result.erase(result.begin(), std::find_if(result.begin(), result.end(), [](unsigned char ch) {
            return !std::isspace(ch);
        }));
        result.erase(std::find_if(result.rbegin(), result.rend(), [](unsigned char ch) {
            return !std::isspace(ch);
        }).base(), result.end());
        return string(result);
    }
    
    string toUpperCase() const {
        std::string result = value_;
        std::transform(result.begin(), result.end(), result.begin(), ::toupper);
        return string(result);
    }
    
    string toLowerCase() const {
        std::string result = value_;
        std::transform(result.begin(), result.end(), result.begin(), ::tolower);
        return string(result);
    }
    
    bool includes(const string& searchStr) const {
        return value_.find(searchStr.value_) != std::string::npos;
    }
    
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
    size_t size() const { return elements_.size(); }
    bool empty() const { return elements_.empty(); }
    
    // JavaScript array methods
    string join(const string& separator = string(",")) const {
        if (elements_.empty()) return string("");
        
        std::ostringstream result;
        for (size_t i = 0; i < elements_.size(); ++i) {
            if (i > 0) result << separator.value();
            if constexpr (std::is_same_v<T, string>) {
                result << elements_[i].value();
            } else if constexpr (std::is_same_v<T, number>) {
                result << elements_[i].value();
            } else {
                result << toString(elements_[i]).value();
            }
        }
        return string(result.str());
    }
    
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
    
    // Remove a property from the object (for delete operator)
    bool remove(const std::string& key) {
        return properties_.erase(key) > 0;
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
    // Date and Error constructors are defined later after class definitions
    any(const Date& val);
    any(const Error& val);
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
    
    // Equality operators for any-to-any comparison
    bool operator==(const any& other) const {
        // Handle the same type comparisons
        if (value_.index() == other.value_.index()) {
            return std::visit([&other](const auto& val) -> bool {
                using T = std::decay_t<decltype(val)>;
                if constexpr (std::is_same_v<T, undefined_t> || std::is_same_v<T, null_t> || std::is_same_v<T, bool>) {
                    return val == std::get<T>(other.value_);
                } else if constexpr (std::is_same_v<T, number>) {
                    return val.value() == std::get<T>(other.value_).value();
                } else if constexpr (std::is_same_v<T, string>) {
                    return val.value() == std::get<T>(other.value_).value();
                } else {
                    // For complex types (array, object), just check if they're the same reference
                    // In JavaScript, objects are compared by reference
                    return &val == &std::get<T>(other.value_);
                }
            }, value_);
        }
        return false; // Different types are not equal
    }
    
    bool operator!=(const any& other) const {
        return !(*this == other);
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
    
    string join(const string& separator = string(",")) const {
        if (is<array<any>>()) {
            return get<array<any>>().join(separator);
        }
        return string(""); // Return empty string for non-arrays
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
// Error class definition moved to after Date class

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

// Runtime operator implementations

/**
 * instanceof operator implementation
 * Note: This is a simplified version - JavaScript instanceof is more complex
 */
template<typename T>
bool instanceof_op(const T& obj, const std::string& typeName) {
    // For now, return false for all cases
    // This is a placeholder implementation
    // In a full implementation, we'd need runtime type information
    return false;
}

// Specialized versions for common cases
inline bool instanceof_op(const any& obj, const std::string& typeName) {
    if (typeName == "Array") {
        return obj.template is<array<any>>();
    } else if (typeName == "Object") {
        return obj.template is<object>();
    } else if (typeName == "String") {
        return obj.template is<string>();
    } else if (typeName == "Number") {
        return obj.template is<number>();
    } else if (typeName == "Boolean") {
        return obj.template is<bool>();
    }
    return false;
}

// Overloads for specific types
inline bool instanceof_op(const array<any>& /*obj*/, const std::string& typeName) {
    return typeName == "Array";
}

inline bool instanceof_op(const string& /*obj*/, const std::string& typeName) {
    return typeName == "String";
}

inline bool instanceof_op(const number& /*obj*/, const std::string& typeName) {
    return typeName == "Number";
}

inline bool instanceof_op(bool /*obj*/, const std::string& typeName) {
    return typeName == "Boolean";
}

/**
 * in operator implementation
 * Checks if a property exists in an object
 */
template<typename Key, typename Obj>
bool in_op(const Key& key, const Obj& obj) {
    // Convert key to string for property access
    std::string keyStr;
    if constexpr (std::is_same_v<Key, string>) {
        keyStr = key.value();
    } else if constexpr (std::is_same_v<Key, std::string>) {
        keyStr = key;
    } else if constexpr (std::is_same_v<Key, number>) {
        keyStr = std::to_string(static_cast<int>(key.value()));
    } else {
        keyStr = "unknown";
    }
    
    // For js::object, check if property exists
    if constexpr (std::is_same_v<Obj, object>) {
        return obj.has(keyStr);
    }
    // For js::any, check if it contains an object and then check the property
    else if constexpr (std::is_same_v<Obj, any>) {
        if (obj.template is<object>()) {
            return obj.template get<object>().has(keyStr);
        }
        // Check if it's an array and the key is a valid index
        else if (obj.template is<array<any>>()) {
            try {
                int index = std::stoi(keyStr);
                const auto& arr = obj.template get<array<any>>();
                return index >= 0 && index < static_cast<int>(arr.size());
            } catch (...) {
                return false;
            }
        }
        return false;
    }
    // For arrays, check if index exists
    else if constexpr (std::is_base_of_v<array<typename Obj::value_type>, Obj>) {
        try {
            int index = std::stoi(keyStr);
            return index >= 0 && index < static_cast<int>(obj.size());
        } catch (...) {
            return false;
        }
    }
    return false;
}

/**
 * delete operator implementation
 * Deletes a property from an object
 */
inline bool delete_property(any& obj, const std::string& property) {
    if (obj.template is<object>()) {
        // We need to extract the object, modify it, and put it back
        // because get<>() returns a copy, not a reference
        object jsObj = obj.template get<object>();
        bool result = jsObj.remove(property);
        obj = any(jsObj);
        return result;
    }
    // For non-objects, delete always returns true but doesn't do anything
    return true;
}

// Generic delete operation
template<typename Obj>
bool delete_op(Obj& obj) {
    // For now, just return true (successful deletion)
    // In JavaScript, delete always returns true except in strict mode with non-configurable properties
    return true;
}

// Date class for JavaScript Date support
class Date {
private:
    std::chrono::system_clock::time_point timePoint;
    
public:
    // Default constructor - current time
    Date() : timePoint(std::chrono::system_clock::now()) {}
    
    // Constructor from milliseconds since epoch
    Date(number milliseconds) {
        auto duration = std::chrono::milliseconds(static_cast<long long>(milliseconds.value()));
        timePoint = std::chrono::system_clock::time_point(duration);
    }
    
    // Constructor from year, month, day, etc.
    Date(number year, number month, number day = number(1), number hours = number(0), 
         number minutes = number(0), number seconds = number(0), number milliseconds = number(0)) {
        std::tm tm = {};
        tm.tm_year = static_cast<int>(year.value()) - 1900;
        tm.tm_mon = static_cast<int>(month.value()); // JavaScript month is 0-based
        tm.tm_mday = static_cast<int>(day.value());
        tm.tm_hour = static_cast<int>(hours.value());
        tm.tm_min = static_cast<int>(minutes.value());
        tm.tm_sec = static_cast<int>(seconds.value());
        
        auto time_t_val = std::mktime(&tm);
        timePoint = std::chrono::system_clock::from_time_t(time_t_val);
        
        // Add milliseconds
        timePoint += std::chrono::milliseconds(static_cast<int>(milliseconds.value()));
    }
    
    // Constructor from string (basic parsing)
    Date(const string& dateString) {
        // Simple ISO 8601 parsing - could be enhanced
        std::istringstream ss(dateString.value());
        std::tm tm = {};
        
        // Try to parse ISO format: YYYY-MM-DDTHH:MM:SS
        if (!(ss >> std::get_time(&tm, "%Y-%m-%dT%H:%M:%S"))) {
            // Fallback to simpler format: YYYY-MM-DD
            ss.clear();
            ss.str(dateString.value());
            if (!(ss >> std::get_time(&tm, "%Y-%m-%d"))) {
                // If parsing fails, use current time
                timePoint = std::chrono::system_clock::now();
                return;
            }
        }
        
        auto time_t_val = std::mktime(&tm);
        timePoint = std::chrono::system_clock::from_time_t(time_t_val);
    }
    
    // Get components
    inline number getFullYear() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        return number(tm.tm_year + 1900);
    }
    
    inline number getMonth() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        return number(tm.tm_mon); // JavaScript months are 0-based
    }
    
    number getDate() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        return number(tm.tm_mday);
    }
    
    number getHours() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        return number(tm.tm_hour);
    }
    
    number getMinutes() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        return number(tm.tm_min);
    }
    
    number getSeconds() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        return number(tm.tm_sec);
    }
    
    // toString method
    string toString() const {
        auto time_t_val = std::chrono::system_clock::to_time_t(timePoint);
        auto tm = *std::localtime(&time_t_val);
        
        char buffer[100];
        std::strftime(buffer, sizeof(buffer), "%a %b %d %Y %H:%M:%S", &tm);
        return string(buffer);
    }
    
    // getTime method - returns milliseconds since epoch
    number getTime() const {
        auto duration = timePoint.time_since_epoch();
        auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(duration);
        return number(static_cast<double>(millis.count()));
    }
};

// Error class for JavaScript Error support
class Error {
private:
    string message_;
    string name_;

public:
    Error() : message_(""), name_("Error") {}
    Error(const string& message) : message_(message), name_("Error") {}
    Error(const string& message, const string& name) : message_(message), name_(name) {}
    
    const string& getMessage() const { return message_; }
    const string& getName() const { return name_; }
    
    string toString() const {
        if (message_.empty()) {
            return name_;
        }
        return name_ + string(": ") + message_;
    }
};

// EvalError class for JavaScript EvalError support
class EvalError : public Error {
public:
    EvalError() : Error("", "EvalError") {}
    EvalError(const string& message) : Error(message, "EvalError") {}
};

// URIError class for JavaScript URIError support
class URIError : public Error {
public:
    URIError() : Error("", "URIError") {}
    URIError(const string& message) : Error(message, "URIError") {}
};

// AggregateError class for JavaScript AggregateError support
class AggregateError : public Error {
private:
    std::vector<any> errors_;
public:
    AggregateError() : Error("", "AggregateError") {}
    AggregateError(const std::vector<any>& errors, const string& message = "") 
        : Error(message, "AggregateError"), errors_(errors) {}
    
    const std::vector<any>& getErrors() const { return errors_; }
};

// Implementation of any constructors that need complete type definitions
inline any::any(const Date& val) {
    object obj;
    obj.set("_type", string("Date"));
    obj.set("_value", number(static_cast<double>(val.getTime())));
    value_ = obj;
}

inline any::any(const Error& val) {
    object obj;
    obj.set("_type", string("Error"));
    obj.set("message", val.getMessage());
    value_ = obj;
}

// Global JavaScript functions
inline number parseInt(const string& str) {
    try {
        double result = std::stod(str.value());
        return number(std::trunc(result)); // parseInt truncates to integer
    } catch (...) {
        return number(std::numeric_limits<double>::quiet_NaN());
    }
}

inline number parseFloat(const string& str) {
    try {
        return number(std::stod(str.value()));
    } catch (...) {
        return number(std::numeric_limits<double>::quiet_NaN());
    }
}

// Math static class for mathematical operations
class Math {
public:
    static constexpr double PI = 3.141592653589793;
    static constexpr double E = 2.718281828459045;
    
    static double random() {
        static std::random_device rd;
        static std::mt19937 gen(rd());
        static std::uniform_real_distribution<> dis(0.0, 1.0);
        return dis(gen);
    }
    
    static number abs(const number& x) {
        return number(std::abs(x.value()));
    }
    
    static number max(const array<number>& values) {
        if (values.length() == 0) {
            return number(-std::numeric_limits<double>::infinity());
        }
        double maxVal = values[0].value();
        for (size_t i = 1; i < values.length(); i++) {
            maxVal = std::max(maxVal, values[i].value());
        }
        return number(maxVal);
    }
    
    static number min(const array<number>& values) {
        if (values.length() == 0) {
            return number(std::numeric_limits<double>::infinity());
        }
        double minVal = values[0].value();
        for (size_t i = 1; i < values.length(); i++) {
            minVal = std::min(minVal, values[i].value());
        }
        return number(minVal);
    }
    
    static number sqrt(const number& x) {
        return number(std::sqrt(x.value()));
    }
    
    static number pow(const number& base, const number& exponent) {
        return number(std::pow(base.value(), exponent.value()));
    }
    
    static number floor(const number& x) {
        return number(std::floor(x.value()));
    }
    
    static number ceil(const number& x) {
        return number(std::ceil(x.value()));
    }
    
    static number round(const number& x) {
        return number(std::round(x.value()));
    }
};

// Symbol class for JavaScript Symbol support
class symbol {
private:
    std::string description;
    static std::unordered_map<std::string, std::shared_ptr<symbol>> global_registry;
    static std::atomic<uint64_t> symbol_counter;
    uint64_t id;
    bool is_global;
    
public:
    // Default constructor - anonymous symbol
    symbol() : description(""), id(symbol_counter++), is_global(false) {}
    
    // Constructor with description
    explicit symbol(const string& desc) : description(desc.value()), id(symbol_counter++), is_global(false) {}
    explicit symbol(const std::string& desc) : description(desc), id(symbol_counter++), is_global(false) {}
    
    // Private constructor for global symbols
    symbol(const std::string& desc, bool global) : description(desc), id(symbol_counter++), is_global(global) {}
    
    // Get symbol description
    string toString() const { 
        if (description.empty()) {
            return string("Symbol()");
        }
        return string("Symbol(" + description + ")");
    }
    
    std::string getDescription() const { return description; }
    
    // Unique identifier for this symbol
    uint64_t getId() const { return id; }
    
    // Global symbol registry methods
    static std::shared_ptr<symbol> for_(const string& key) {
        return for_(key.value());
    }
    
    static std::shared_ptr<symbol> for_(const std::string& key) {
        auto it = global_registry.find(key);
        if (it != global_registry.end()) {
            return it->second;
        }
        auto sym = std::make_shared<symbol>(key, true);
        global_registry[key] = sym;
        return sym;
    }
    
    static string keyFor(const std::shared_ptr<symbol>& sym) {
        if (!sym || !sym->is_global) {
            return string(""); // undefined in JavaScript
        }
        
        for (const auto& pair : global_registry) {
            if (pair.second.get() == sym.get()) {
                return string(pair.first);
            }
        }
        return string(""); // undefined
    }
    
    // Comparison operators (symbols are only equal to themselves)
    bool operator==(const symbol& other) const {
        return id == other.id;
    }
    
    bool operator!=(const symbol& other) const {
        return !(*this == other);
    }
    
    // Hash function for use in containers
    struct hash {
        std::size_t operator()(const symbol& s) const {
            return std::hash<uint64_t>{}(s.id);
        }
    };
    
    // Well-known symbols (static constants)
    static std::shared_ptr<symbol> iterator;
    static std::shared_ptr<symbol> asyncIterator; 
    static std::shared_ptr<symbol> match;
    static std::shared_ptr<symbol> replace;
    static std::shared_ptr<symbol> search;
    static std::shared_ptr<symbol> split;
    static std::shared_ptr<symbol> hasInstance;
    static std::shared_ptr<symbol> isConcatSpreadable;
    static std::shared_ptr<symbol> species;
    static std::shared_ptr<symbol> toPrimitive;
    static std::shared_ptr<symbol> toStringTag;
    static std::shared_ptr<symbol> metadata; // TypeScript 5.2+ decorator metadata
};

// Static member definitions
inline std::unordered_map<std::string, std::shared_ptr<symbol>> symbol::global_registry;
inline std::atomic<uint64_t> symbol::symbol_counter{0};

// Well-known symbols initialization
inline std::shared_ptr<symbol> symbol::iterator = std::make_shared<symbol>("Symbol.iterator", true);
inline std::shared_ptr<symbol> symbol::asyncIterator = std::make_shared<symbol>("Symbol.asyncIterator", true);
inline std::shared_ptr<symbol> symbol::match = std::make_shared<symbol>("Symbol.match", true);
inline std::shared_ptr<symbol> symbol::replace = std::make_shared<symbol>("Symbol.replace", true);
inline std::shared_ptr<symbol> symbol::search = std::make_shared<symbol>("Symbol.search", true);
inline std::shared_ptr<symbol> symbol::split = std::make_shared<symbol>("Symbol.split", true);
inline std::shared_ptr<symbol> symbol::hasInstance = std::make_shared<symbol>("Symbol.hasInstance", true);
inline std::shared_ptr<symbol> symbol::isConcatSpreadable = std::make_shared<symbol>("Symbol.isConcatSpreadable", true);
inline std::shared_ptr<symbol> symbol::species = std::make_shared<symbol>("Symbol.species", true);
inline std::shared_ptr<symbol> symbol::toPrimitive = std::make_shared<symbol>("Symbol.toPrimitive", true);
inline std::shared_ptr<symbol> symbol::toStringTag = std::make_shared<symbol>("Symbol.toStringTag", true);
inline std::shared_ptr<symbol> symbol::metadata = std::make_shared<symbol>("Symbol.metadata", true);

// BigInt class for JavaScript BigInt support  
class bigint {
private:
    std::string value;
    bool negative;
    
    void normalize() {
        // Remove leading zeros
        size_t first_non_zero = value.find_first_not_of('0');
        if (first_non_zero == std::string::npos) {
            value = "0";
            negative = false;
        } else {
            value = value.substr(first_non_zero);
        }
    }
    
public:
    // Constructors
    bigint() : value("0"), negative(false) {}
    
    bigint(int64_t n) {
        negative = n < 0;
        value = std::to_string(negative ? -n : n);
    }
    
    bigint(const string& str) : bigint(str.value()) {}
    
    bigint(const std::string& str) {
        if (str.empty()) {
            value = "0";
            negative = false;
        } else {
            size_t start = 0;
            negative = str[0] == '-';
            if (negative || str[0] == '+') {
                start = 1;
            }
            value = str.substr(start);
            normalize();
        }
    }
    
    bigint(const char* str) : bigint(std::string(str)) {}
    
    // String conversion
    string toString() const {
        return string((negative && value != "0") ? "-" + value : value);
    }
    
    std::string toStdString() const {
        return (negative && value != "0") ? "-" + value : value;
    }
    
    // Basic arithmetic operators (simplified implementation for demonstration)
    // Note: A production implementation would need proper arbitrary precision arithmetic
    bigint operator+(const bigint& other) const {
        // Simplified - in reality would need proper big integer arithmetic
        if (!negative && !other.negative) {
            // Both positive - simplified string addition would go here
            return bigint(toStdString() + "+" + other.toStdString());
        } else {
            // Handle mixed sign cases - simplified
            return bigint(toStdString() + "+" + other.toStdString());
        }
    }
    
    bigint operator-(const bigint& other) const {
        return bigint(toStdString() + "-" + other.toStdString());
    }
    
    bigint operator*(const bigint& other) const {
        return bigint(toStdString() + "*" + other.toStdString());
    }
    
    bigint operator/(const bigint& other) const {
        if (other.value == "0") {
            throw std::runtime_error("Division by zero in bigint");
        }
        return bigint(toStdString() + "/" + other.toStdString());
    }
    
    bigint operator%(const bigint& other) const {
        if (other.value == "0") {
            throw std::runtime_error("Division by zero in bigint modulo");
        }
        return bigint(toStdString() + "%" + other.toStdString());
    }
    
    // Comparison operators
    bool operator==(const bigint& other) const {
        return negative == other.negative && value == other.value;
    }
    
    bool operator!=(const bigint& other) const {
        return !(*this == other);
    }
    
    bool operator<(const bigint& other) const {
        if (negative != other.negative) {
            return negative; // negative < positive
        }
        if (value.length() != other.value.length()) {
            return negative ? value.length() > other.value.length() 
                            : value.length() < other.value.length();
        }
        return negative ? value > other.value : value < other.value;
    }
    
    bool operator>(const bigint& other) const {
        return other < *this;
    }
    
    bool operator<=(const bigint& other) const {
        return !(*this > other);
    }
    
    bool operator>=(const bigint& other) const {
        return !(*this < other);
    }
    
    // Static methods
    static bigint asIntN(size_t bits, const bigint& value) {
        // Simplified implementation - would need proper bit manipulation
        return value;
    }
    
    static bigint asUintN(size_t bits, const bigint& value) {
        // Simplified implementation - would need proper bit manipulation  
        return value;
    }
    
    // Output stream operator
    friend std::ostream& operator<<(std::ostream& os, const bigint& bi) {
        os << bi.toStdString();
        return os;
    }
};

// Function wrapper for JavaScript function callbacks
class function {
public:
    virtual ~function() = default;
    
    // Virtual methods for different call patterns
    virtual any invoke(std::initializer_list<any> args) = 0;
    virtual any invoke(const std::vector<any>& args) = 0;
    
    // Template operator() for direct calls
    template <typename... Args>
    any operator()(Args&&... args) {
        std::vector<any> arg_vec;
        arg_vec.reserve(sizeof...(args));
        (arg_vec.emplace_back(std::forward<Args>(args)), ...);
        return invoke(arg_vec);
    }
    
    // Call method (JavaScript function.call equivalent)
    template <typename ThisType, typename... Args>
    any call(ThisType&& thisArg, Args&&... args) {
        // For now, ignore thisArg in simplified implementation
        return operator()(std::forward<Args>(args)...);
    }
    
    // Apply method (JavaScript function.apply equivalent)
    any apply(const any& thisArg, const std::vector<any>& args) {
        // For now, ignore thisArg in simplified implementation  
        return invoke(args);
    }
};

// Template implementation for specific function types
template <typename F>
class function_impl : public function {
private:
    F func;
    
    // Helper to detect function signature
    template<typename T>
    struct function_traits;
    
    template<typename R, typename... Args>
    struct function_traits<R(Args...)> {
        using return_type = R;
        using args_tuple = std::tuple<Args...>;
        static constexpr size_t arity = sizeof...(Args);
    };
    
    template<typename R, typename... Args>
    struct function_traits<R(*)(Args...)> : function_traits<R(Args...)> {};
    
    template<typename R, typename C, typename... Args>
    struct function_traits<R(C::*)(Args...)> : function_traits<R(Args...)> {};
    
    template<typename R, typename C, typename... Args>
    struct function_traits<R(C::*)(Args...) const> : function_traits<R(Args...)> {};
    
public:
    explicit function_impl(F f) : func(std::move(f)) {}
    
    any invoke(std::initializer_list<any> args) override {
        std::vector<any> arg_vec(args);
        return invoke(arg_vec);
    }
    
    any invoke(const std::vector<any>& args) override {
        return invoke_helper(args, std::make_index_sequence<function_traits<F>::arity>{});
    }
    
private:
    template<size_t... Is>
    any invoke_helper(const std::vector<any>& args, std::index_sequence<Is...>) {
        // Simplified argument conversion - in practice would need proper type conversion
        if constexpr (std::is_void_v<typename function_traits<F>::return_type>) {
            if constexpr (function_traits<F>::arity == 0) {
                func();
            } else {
                func(get_arg<Is>(args)...);
            }
            return any(); // undefined for void functions
        } else {
            if constexpr (function_traits<F>::arity == 0) {
                return any(func());
            } else {
                return any(func(get_arg<Is>(args)...));
            }
        }
    }
    
    template<size_t I>
    auto get_arg(const std::vector<any>& args) {
        if (I < args.size()) {
            // Simplified - would need proper type conversion based on target type
            return args[I];
        } else {
            return any(); // undefined for missing arguments
        }
    }
};

// Factory function to create function wrappers
template<typename F>
std::shared_ptr<function> make_function(F&& f) {
    return std::make_shared<function_impl<std::decay_t<F>>>(std::forward<F>(f));
}

// Lambda wrapper for convenience
template<typename F>
std::shared_ptr<function> lambda(F&& f) {
    return make_function(std::forward<F>(f));
}

// URL encoding/decoding global functions
inline string encodeURI(const string& uri) {
    std::string result;
    std::string str = uri.toStdString();
    for (size_t i = 0; i < str.length(); ++i) {
        unsigned char c = str[i];
        // Characters that don't need encoding (RFC 3986 unreserved + reserved)
        if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || 
            (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.' || c == '~' ||
            c == '!' || c == '#' || c == '$' || c == '&' || c == '\'' || c == '(' ||
            c == ')' || c == '*' || c == '+' || c == ',' || c == '/' || c == ':' ||
            c == ';' || c == '=' || c == '?' || c == '@' || c == '[' || c == ']') {
            result += c;
        } else {
            // Encode as %XX
            char hex[4];
            snprintf(hex, sizeof(hex), "%%%02X", c);
            result += hex;
        }
    }
    return string(result);
}

inline string decodeURI(const string& uri) {
    std::string result;
    std::string str = uri.toStdString();
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '%' && i + 2 < str.length()) {
            // Decode %XX
            char hex[3] = { str[i + 1], str[i + 2], '\0' };
            char* end;
            long val = strtol(hex, &end, 16);
            if (end == hex + 2) {
                result += static_cast<char>(val);
                i += 2;
            } else {
                // Invalid hex sequence, keep as-is
                result += str[i];
            }
        } else {
            result += str[i];
        }
    }
    return string(result);
}

inline string encodeURIComponent(const string& component) {
    std::string result;
    std::string str = component.toStdString();
    for (size_t i = 0; i < str.length(); ++i) {
        unsigned char c = str[i];
        // Characters that don't need encoding (RFC 3986 unreserved only)
        if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || 
            (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.' || c == '~') {
            result += c;
        } else {
            // Encode as %XX
            char hex[4];
            snprintf(hex, sizeof(hex), "%%%02X", c);
            result += hex;
        }
    }
    return string(result);
}

inline string decodeURIComponent(const string& component) {
    std::string result;
    std::string str = component.toStdString();
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '%' && i + 2 < str.length()) {
            // Decode %XX
            char hex[3] = { str[i + 1], str[i + 2], '\0' };
            char* end;
            long val = strtol(hex, &end, 16);
            if (end == hex + 2) {
                result += static_cast<char>(val);
                i += 2;
            } else {
                // Invalid hex sequence, keep as-is
                result += str[i];
            }
        } else {
            result += str[i];
        }
    }
    return string(result);
}

} // namespace js

// Include type guards for logical operators and runtime checks
#include "type_guards.h"

// Include typed wrappers for union types
#include "typed_wrappers.h"

#endif // TYPESCRIPT2CXX_RUNTIME_CORE_H