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

// Forward declarations
class string;
class object;
template<typename T> class array;
class Promise;
class Error;

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

// Any type for dynamic values
using any = std::variant<
    undefined_t,
    null_t,
    bool,
    double,
    string,
    std::shared_ptr<object>,
    std::shared_ptr<array<any>>
>;

// Number type with comprehensive JavaScript semantics
class number {
private:
    double value_;

public:
    number() : value_(0.0) {}
    number(double v) : value_(v) {}
    number(int v) : value_(static_cast<double>(v)) {}
    number(const std::string& str);

    // Conversion operators
    operator double() const { return value_; }
    operator int() const { return static_cast<int>(value_); }
    operator bool() const { return value_ != 0.0 && !std::isnan(value_); }

    // Arithmetic operators
    number operator+(const number& other) const { return number(value_ + other.value_); }
    number operator-(const number& other) const { return number(value_ - other.value_); }
    number operator*(const number& other) const { return number(value_ * other.value_); }
    number operator/(const number& other) const { return number(value_ / other.value_); }
    number operator%(const number& other) const { return number(std::fmod(value_, other.value_)); }
    
    // Assignment operators
    number& operator+=(const number& other) { value_ += other.value_; return *this; }
    number& operator-=(const number& other) { value_ -= other.value_; return *this; }
    number& operator*=(const number& other) { value_ *= other.value_; return *this; }
    number& operator/=(const number& other) { value_ /= other.value_; return *this; }

    // Comparison operators
    bool operator==(const number& other) const { return value_ == other.value_; }
    bool operator!=(const number& other) const { return value_ != other.value_; }
    bool operator<(const number& other) const { return value_ < other.value_; }
    bool operator<=(const number& other) const { return value_ <= other.value_; }
    bool operator>(const number& other) const { return value_ > other.value_; }
    bool operator>=(const number& other) const { return value_ >= other.value_; }

    // JavaScript number methods
    string toString(int radix = 10) const;
    string toFixed(int digits = 0) const;
    string toExponential(int fractionDigits = -1) const;
    string toPrecision(int precision = -1) const;

    // Static methods
    static number parseInt(const string& str, int radix = 10);
    static number parseFloat(const string& str);
    static bool isNaN(const number& num) { return std::isnan(num.value_); }
    static bool isFinite(const number& num) { return std::isfinite(num.value_); }
    static bool isInteger(const number& num);
    static bool isSafeInteger(const number& num);

    // Constants
    static const number NaN;
    static const number POSITIVE_INFINITY;
    static const number NEGATIVE_INFINITY;
    static const number MAX_VALUE;
    static const number MIN_VALUE;
    static const number EPSILON;
    static const number MAX_SAFE_INTEGER;
    static const number MIN_SAFE_INTEGER;

    double getValue() const { return value_; }
};

// String type with comprehensive JavaScript behavior
class string {
private:
    std::string value_;

public:
    string() = default;
    string(const char* s) : value_(s ? s : "") {}
    string(const std::string& s) : value_(s) {}
    string(const number& num) : value_(num.toString().value_) {}
    string(bool b) : value_(b ? "true" : "false") {}

    // Conversion operators
    operator std::string() const { return value_; }
    const char* c_str() const { return value_.c_str(); }

    // String operators
    string operator+(const string& other) const { return string(value_ + other.value_); }
    string& operator+=(const string& other) { value_ += other.value_; return *this; }
    bool operator==(const string& other) const { return value_ == other.value_; }
    bool operator!=(const string& other) const { return value_ != other.value_; }
    bool operator<(const string& other) const { return value_ < other.value_; }
    bool operator<=(const string& other) const { return value_ <= other.value_; }
    bool operator>(const string& other) const { return value_ > other.value_; }
    bool operator>=(const string& other) const { return value_ >= other.value_; }

    // Element access
    string operator[](size_t index) const;
    string charAt(size_t index) const;
    number charCodeAt(size_t index) const;
    number codePointAt(size_t index) const;

    // String methods - Core
    size_t length() const { return value_.length(); }
    size_t size() const { return value_.size(); }
    bool empty() const { return value_.empty(); }

    // Substring methods
    string slice(int start, int end = -1) const;
    string substring(int start, int end = -1) const;
    string substr(int start, int length = -1) const;

    // Case methods
    string toLowerCase() const;
    string toUpperCase() const;
    string toLocaleLowerCase() const;
    string toLocaleUpperCase() const;

    // Trim methods
    string trim() const;
    string trimStart() const;
    string trimEnd() const;

    // Search methods
    int indexOf(const string& searchString, size_t fromIndex = 0) const;
    int lastIndexOf(const string& searchString, size_t fromIndex = std::string::npos) const;
    bool includes(const string& searchString, size_t fromIndex = 0) const;
    bool startsWith(const string& searchString, size_t position = 0) const;
    bool endsWith(const string& searchString, size_t length = std::string::npos) const;
    int search(const std::regex& regexp) const;

    // Split and replace methods
    array<string> split(const string& separator = "", int limit = -1) const;
    array<string> split(const std::regex& separator, int limit = -1) const;
    string replace(const string& searchValue, const string& replaceValue) const;
    string replace(const std::regex& searchValue, const string& replaceValue) const;
    string replaceAll(const string& searchValue, const string& replaceValue) const;
    std::optional<array<string>> match(const std::regex& regexp) const;
    array<string> matchAll(const std::regex& regexp) const;

    // Pad methods
    string padStart(size_t targetLength, const string& padString = " ") const;
    string padEnd(size_t targetLength, const string& padString = " ") const;
    string repeat(size_t count) const;

    // Conversion methods
    string toString() const { return *this; }
    string valueOf() const { return *this; }

    // Static methods
    static string fromCharCode(const std::vector<number>& codes);
    static string fromCodePoint(const std::vector<number>& codePoints);
    static string raw(const std::vector<string>& template_strings, const std::vector<any>& substitutions = {});

    // Internal value access
    const std::string& getValue() const { return value_; }
    std::string& getValue() { return value_; }
};

// Stream operator for js::string
inline std::ostream& operator<<(std::ostream& os, const string& str) {
    return os << str.getValue();
}

// String literal operator
inline string operator""_S(const char* str, size_t) {
    return string(str);
}

// Array type with comprehensive JavaScript behavior
template<typename T = any>
class array {
private:
    std::vector<T> elements_;

public:
    using value_type = T;
    using iterator = typename std::vector<T>::iterator;
    using const_iterator = typename std::vector<T>::const_iterator;

    // Constructors
    array() = default;
    array(const std::initializer_list<T>& init) : elements_(init) {}
    array(size_t size, const T& value = T{}) : elements_(size, value) {}
    array(const std::vector<T>& vec) : elements_(vec) {}

    // Element access
    T& operator[](size_t index) { return elements_[index]; }
    const T& operator[](size_t index) const { return elements_[index]; }
    T& at(size_t index) { return elements_.at(index); }
    const T& at(size_t index) const { return elements_.at(index); }

    // Capacity
    size_t length() const { return elements_.size(); }
    size_t size() const { return elements_.size(); }
    bool empty() const { return elements_.empty(); }
    void resize(size_t size, const T& value = T{}) { elements_.resize(size, value); }

    // Iterators
    iterator begin() { return elements_.begin(); }
    const_iterator begin() const { return elements_.begin(); }
    iterator end() { return elements_.end(); }
    const_iterator end() const { return elements_.end(); }

    // Mutating methods
    void push(const T& item) { elements_.push_back(item); }
    void push_back(const T& item) { elements_.push_back(item); }
    T pop() { T item = elements_.back(); elements_.pop_back(); return item; }
    T shift() { T item = elements_.front(); elements_.erase(elements_.begin()); return item; }
    void unshift(const T& item) { elements_.insert(elements_.begin(), item); }
    
    array<T> splice(size_t start, size_t deleteCount = std::string::npos, const std::vector<T>& items = {});
    void sort(std::function<bool(const T&, const T&)> compareFn = nullptr);
    void reverse();
    void fill(const T& value, size_t start = 0, size_t end = std::string::npos);

    // Non-mutating methods
    array<T> slice(int start = 0, int end = -1) const;
    array<T> concat(const array<T>& other) const;
    array<T> concat(const std::vector<array<T>>& others) const;
    string join(const string& separator = ",") const;

    // Iteration methods
    template<typename Func>
    void forEach(Func func) const;
    
    template<typename Func>
    auto map(Func func) const -> array<decltype(func(std::declval<T>()))>;
    
    template<typename Func>
    array<T> filter(Func func) const;
    
    template<typename Func, typename U>
    U reduce(Func func, U initial) const;
    
    template<typename Func>
    T reduce(Func func) const;

    template<typename Func, typename U>
    U reduceRight(Func func, U initial) const;

    // Search methods
    template<typename Func>
    std::optional<T> find(Func func) const;
    
    template<typename Func>
    int findIndex(Func func) const;
    
    int indexOf(const T& searchElement, size_t fromIndex = 0) const;
    int lastIndexOf(const T& searchElement, size_t fromIndex = std::string::npos) const;
    bool includes(const T& searchElement, size_t fromIndex = 0) const;

    // Testing methods
    template<typename Func>
    bool every(Func func) const;
    
    template<typename Func>
    bool some(Func func) const;

    // Conversion methods
    string toString() const { return join(","); }
    array<string> toStringArray() const;

    // ES6+ methods
    template<typename... Args>
    static array<T> of(Args&&... args);
    
    template<typename Container>
    static array<T> from(const Container& arrayLike);

    // Flatten methods
    array<any> flat(size_t depth = 1) const;
    template<typename Func>
    auto flatMap(Func func) const -> array<typename std::decay<decltype(func(std::declval<T>()))>::type>;

    // Internal access
    const std::vector<T>& getVector() const { return elements_; }
    std::vector<T>& getVector() { return elements_; }
};

// Object type with prototype chain support
class object {
private:
    std::unordered_map<string, any> properties_;
    std::shared_ptr<object> prototype_;

public:
    object() = default;
    object(const std::initializer_list<std::pair<string, any>>& init);

    // Property access
    any& operator[](const string& key) { return properties_[key]; }
    const any& operator[](const string& key) const;
    bool hasOwnProperty(const string& key) const;
    bool hasProperty(const string& key) const; // Includes prototype chain

    // Property management
    void defineProperty(const string& key, const any& value);
    void deleteProperty(const string& key);
    array<string> getOwnPropertyNames() const;
    array<string> keys() const;
    array<any> values() const;
    array<std::pair<string, any>> entries() const;

    // Prototype chain
    void setPrototype(std::shared_ptr<object> proto) { prototype_ = proto; }
    std::shared_ptr<object> getPrototype() const { return prototype_; }

    // Object methods
    string toString() const { return "[object Object]"; }
    any valueOf() const { return any(*this); }

    // Static methods
    static array<string> keys(const object& obj);
    static array<any> values(const object& obj);
    static array<std::pair<string, any>> entries(const object& obj);
    static object assign(object& target, const std::vector<object>& sources);
    static std::shared_ptr<object> create(std::shared_ptr<object> proto);

    // Internal access
    const std::unordered_map<string, any>& getProperties() const { return properties_; }
};

// Math object implementation
class Math {
public:
    // Constants
    static constexpr double E = 2.718281828459045;
    static constexpr double LN10 = 2.302585092994046;
    static constexpr double LN2 = 0.6931471805599453;
    static constexpr double LOG10E = 0.4342944819032518;
    static constexpr double LOG2E = 1.4426950408889634;
    static constexpr double PI = 3.141592653589793;
    static constexpr double SQRT1_2 = 0.7071067811865476;
    static constexpr double SQRT2 = 1.4142135623730951;

    // Basic operations
    static double abs(double x) { return std::abs(x); }
    static double sign(double x) { return (x > 0) ? 1.0 : (x < 0) ? -1.0 : x; }
    static double max(const std::vector<double>& values);
    static double min(const std::vector<double>& values);
    static double random() { static std::random_device rd; static std::mt19937 gen(rd()); static std::uniform_real_distribution<> dis(0, 1); return dis(gen); }

    // Rounding
    static double ceil(double x) { return std::ceil(x); }
    static double floor(double x) { return std::floor(x); }
    static double round(double x) { return std::round(x); }
    static double trunc(double x) { return std::trunc(x); }

    // Exponential and logarithmic
    static double exp(double x) { return std::exp(x); }
    static double expm1(double x) { return std::expm1(x); }
    static double log(double x) { return std::log(x); }
    static double log1p(double x) { return std::log1p(x); }
    static double log10(double x) { return std::log10(x); }
    static double log2(double x) { return std::log2(x); }
    static double pow(double base, double exponent) { return std::pow(base, exponent); }
    static double sqrt(double x) { return std::sqrt(x); }
    static double cbrt(double x) { return std::cbrt(x); }

    // Trigonometric
    static double sin(double x) { return std::sin(x); }
    static double cos(double x) { return std::cos(x); }
    static double tan(double x) { return std::tan(x); }
    static double asin(double x) { return std::asin(x); }
    static double acos(double x) { return std::acos(x); }
    static double atan(double x) { return std::atan(x); }
    static double atan2(double y, double x) { return std::atan2(y, x); }

    // Hyperbolic
    static double sinh(double x) { return std::sinh(x); }
    static double cosh(double x) { return std::cosh(x); }
    static double tanh(double x) { return std::tanh(x); }
    static double asinh(double x) { return std::asinh(x); }
    static double acosh(double x) { return std::acosh(x); }
    static double atanh(double x) { return std::atanh(x); }

    // Other
    static double hypot(const std::vector<double>& values);
    static int32_t imul(int32_t a, int32_t b);
    static int32_t clz32(uint32_t x);
};

// Date object implementation
class Date {
private:
    std::chrono::system_clock::time_point time_point_;

public:
    Date();
    Date(double milliseconds);
    Date(const string& dateString);
    Date(int year, int month, int day = 1, int hours = 0, int minutes = 0, int seconds = 0, int ms = 0);

    // Static methods
    static double now();
    static double parse(const string& dateString);
    static double UTC(int year, int month, int day = 1, int hours = 0, int minutes = 0, int seconds = 0, int ms = 0);

    // Getters
    int getFullYear() const;
    int getMonth() const; // 0-11
    int getDate() const; // 1-31
    int getHours() const;
    int getMinutes() const;
    int getSeconds() const;
    int getMilliseconds() const;
    int getDay() const; // 0-6, Sunday = 0
    double getTime() const;
    int getTimezoneOffset() const;

    // UTC getters
    int getUTCFullYear() const;
    int getUTCMonth() const;
    int getUTCDate() const;
    int getUTCHours() const;
    int getUTCMinutes() const;
    int getUTCSeconds() const;
    int getUTCMilliseconds() const;
    int getUTCDay() const;

    // Setters
    void setFullYear(int year, int month = -1, int date = -1);
    void setMonth(int month, int date = -1);
    void setDate(int date);
    void setHours(int hours, int minutes = -1, int seconds = -1, int ms = -1);
    void setMinutes(int minutes, int seconds = -1, int ms = -1);
    void setSeconds(int seconds, int ms = -1);
    void setMilliseconds(int ms);
    void setTime(double time);

    // UTC setters
    void setUTCFullYear(int year, int month = -1, int date = -1);
    void setUTCMonth(int month, int date = -1);
    void setUTCDate(int date);
    void setUTCHours(int hours, int minutes = -1, int seconds = -1, int ms = -1);
    void setUTCMinutes(int minutes, int seconds = -1, int ms = -1);
    void setUTCSeconds(int seconds, int ms = -1);
    void setUTCMilliseconds(int ms);

    // String methods
    string toString() const;
    string toDateString() const;
    string toTimeString() const;
    string toISOString() const;
    string toUTCString() const;
    string toLocaleDateString() const;
    string toLocaleTimeString() const;
    string toLocaleString() const;
    string toJSON() const { return toISOString(); }

    double valueOf() const { return getTime(); }
};

// RegExp object implementation
class RegExp {
private:
    std::regex regex_;
    string pattern_;
    string flags_;
    bool global_;
    bool ignoreCase_;
    bool multiline_;
    mutable size_t lastIndex_;

public:
    RegExp(const string& pattern, const string& flags = "");

    // Properties
    string getSource() const { return pattern_; }
    string getFlags() const { return flags_; }
    bool getGlobal() const { return global_; }
    bool getIgnoreCase() const { return ignoreCase_; }
    bool getMultiline() const { return multiline_; }
    size_t getLastIndex() const { return lastIndex_; }
    void setLastIndex(size_t index) { lastIndex_ = index; }

    // Methods
    bool test(const string& str) const;
    std::optional<array<string>> exec(const string& str) const;
    string toString() const;

    // Internal access
    const std::regex& getRegex() const { return regex_; }
};

// Error classes hierarchy
class Error {
private:
    string message_;
    string name_;
    string stack_;

public:
    Error(const string& message = "", const string& name = "Error");

    string getMessage() const { return message_; }
    string getName() const { return name_; }
    string getStack() const { return stack_; }
    void setStack(const string& stack) { stack_ = stack; }

    virtual string toString() const { return name_ + ": " + message_; }
};

class TypeError : public Error {
public:
    TypeError(const string& message = "") : Error(message, "TypeError") {}
};

class ReferenceError : public Error {
public:
    ReferenceError(const string& message = "") : Error(message, "ReferenceError") {}
};

class SyntaxError : public Error {
public:
    SyntaxError(const string& message = "") : Error(message, "SyntaxError") {}
};

class RangeError : public Error {
public:
    RangeError(const string& message = "") : Error(message, "RangeError") {}
};

class EvalError : public Error {
public:
    EvalError(const string& message = "") : Error(message, "EvalError") {}
};

class URIError : public Error {
public:
    URIError(const string& message = "") : Error(message, "URIError") {}
};

// JSON object implementation
class JSON {
public:
    using ReplacerFunc = std::function<any(const string&, const any&)>;
    using ReviverFunc = std::function<any(const string&, const any&)>;

    static string stringify(const any& value, const ReplacerFunc& replacer = nullptr, const string& space = "");
    static string stringify(const any& value, const array<string>& replacer, const string& space = "");
    static any parse(const string& text, const ReviverFunc& reviver = nullptr);

private:
    static string stringifyValue(const any& value, const ReplacerFunc& replacer, const string& space, int indent);
    static string escapeString(const string& str);
};

// Console object implementation
class Console {
public:
    template<typename... Args>
    void log(Args&&... args) {
        print(std::cout, std::forward<Args>(args)...);
        std::cout << std::endl;
    }

    template<typename... Args>
    void error(Args&&... args) {
        print(std::cerr, std::forward<Args>(args)...);
        std::cerr << std::endl;
    }

    template<typename... Args>
    void warn(Args&&... args) {
        print(std::cerr, "Warning: ", std::forward<Args>(args)...);
        std::cerr << std::endl;
    }

    template<typename... Args>
    void info(Args&&... args) {
        print(std::cout, "Info: ", std::forward<Args>(args)...);
        std::cout << std::endl;
    }

    template<typename... Args>
    void debug(Args&&... args) {
        print(std::cout, "Debug: ", std::forward<Args>(args)...);
        std::cout << std::endl;
    }

    void clear() { std::cout << "\033[2J\033[H"; }
    
    template<typename... Args>
    void trace(Args&&... args) {
        print(std::cerr, "Trace: ", std::forward<Args>(args)...);
        std::cerr << std::endl;
        // TODO: Add stack trace
    }

    template<typename T>
    void table(const T& data) {
        // Simplified table implementation
        log(data);
    }

    template<typename T>
    void dir(const T& obj) {
        // Simplified directory listing
        log(obj);
    }

    void time(const string& label = "default");
    void timeEnd(const string& label = "default");
    void timeLog(const string& label = "default");

    template<typename T>
    void assert(bool condition, const T& message) {
        if (!condition) {
            error("Assertion failed:", message);
        }
    }

    void count(const string& label = "default");
    void countReset(const string& label = "default");

    void group(const string& label = "");
    void groupCollapsed(const string& label = "");
    void groupEnd();

private:
    std::unordered_map<string, std::chrono::steady_clock::time_point> timers_;
    std::unordered_map<string, int> counters_;
    int groupLevel_ = 0;

    template<typename Stream, typename T>
    void print(Stream& stream, T&& value) {
        stream << value;
    }

    template<typename Stream, typename T, typename... Args>
    void print(Stream& stream, T&& first, Args&&... rest) {
        stream << first;
        if (sizeof...(rest) > 0) {
            stream << " ";
        }
        print(stream, std::forward<Args>(rest)...);
    }
};

// Global instances
inline Console console;
inline Math math;

// Global functions
number parseInt(const string& str, int radix = 10);
number parseFloat(const string& str);
bool isNaN(const any& value);
bool isFinite(const any& value);
string encodeURI(const string& uri);
string decodeURI(const string& encodedURI);
string encodeURIComponent(const string& component);
string decodeURIComponent(const string& encodedComponent);

// Type conversion functions
string toString(const any& value);
number toNumber(const any& value);
bool toBoolean(const any& value);

// JavaScript operators implemented as functions
string typeof_op(const any& value);
bool instanceof_op(const any& obj, const any& constructor);
bool in_op(const string& property, const object& obj);
bool delete_op(object& obj, const string& property);

// Utility functions for template methods implementation
namespace detail {
    template<typename T>
    string stringify(const T& value) {
        if constexpr (std::is_same_v<T, string>) {
            return value;
        } else if constexpr (std::is_arithmetic_v<T>) {
            return string(std::to_string(value));
        } else {
            return toString(any(value));
        }
    }
}

} // namespace js

// Implementation of template methods
namespace js {

// Array template method implementations
template<typename T>
array<T> array<T>::splice(size_t start, size_t deleteCount, const std::vector<T>& items) {
    array<T> deleted;
    if (start >= elements_.size()) {
        start = elements_.size();
    }
    
    size_t actualDeleteCount = std::min(deleteCount, elements_.size() - start);
    if (deleteCount == std::string::npos) {
        actualDeleteCount = elements_.size() - start;
    }
    
    // Copy deleted elements
    for (size_t i = 0; i < actualDeleteCount; ++i) {
        deleted.push(elements_[start + i]);
    }
    
    // Remove elements
    elements_.erase(elements_.begin() + start, elements_.begin() + start + actualDeleteCount);
    
    // Insert new elements
    elements_.insert(elements_.begin() + start, items.begin(), items.end());
    
    return deleted;
}

template<typename T>
void array<T>::sort(std::function<bool(const T&, const T&)> compareFn) {
    if (compareFn) {
        std::sort(elements_.begin(), elements_.end(), compareFn);
    } else {
        std::sort(elements_.begin(), elements_.end());
    }
}

template<typename T>
void array<T>::reverse() {
    std::reverse(elements_.begin(), elements_.end());
}

template<typename T>
void array<T>::fill(const T& value, size_t start, size_t end) {
    if (end == std::string::npos) end = elements_.size();
    std::fill(elements_.begin() + start, elements_.begin() + std::min(end, elements_.size()), value);
}

template<typename T>
array<T> array<T>::slice(int start, int end) const {
    size_t size = elements_.size();
    size_t actualStart = (start < 0) ? std::max(0, (int)size + start) : std::min((size_t)start, size);
    size_t actualEnd = (end < 0) ? std::max(0, (int)size + end) : std::min((size_t)end, size);
    
    if (end == -1) actualEnd = size;
    if (actualStart >= actualEnd) return array<T>();
    
    return array<T>(std::vector<T>(elements_.begin() + actualStart, elements_.begin() + actualEnd));
}

template<typename T>
array<T> array<T>::concat(const array<T>& other) const {
    array<T> result = *this;
    result.elements_.insert(result.elements_.end(), other.elements_.begin(), other.elements_.end());
    return result;
}

template<typename T>
array<T> array<T>::concat(const std::vector<array<T>>& others) const {
    array<T> result = *this;
    for (const auto& other : others) {
        result.elements_.insert(result.elements_.end(), other.elements_.begin(), other.elements_.end());
    }
    return result;
}

template<typename T>
string array<T>::join(const string& separator) const {
    if (elements_.empty()) return "";
    
    std::ostringstream oss;
    for (size_t i = 0; i < elements_.size(); ++i) {
        if (i > 0) oss << separator.getValue();
        oss << detail::stringify(elements_[i]);
    }
    return string(oss.str());
}

template<typename T>
template<typename Func>
void array<T>::forEach(Func func) const {
    for (size_t i = 0; i < elements_.size(); ++i) {
        func(elements_[i], i, *this);
    }
}

template<typename T>
template<typename Func>
auto array<T>::map(Func func) const -> array<decltype(func(std::declval<T>()))> {
    using ReturnType = decltype(func(std::declval<T>()));
    array<ReturnType> result;
    
    for (size_t i = 0; i < elements_.size(); ++i) {
        result.push(func(elements_[i], i, *this));
    }
    return result;
}

template<typename T>
template<typename Func>
array<T> array<T>::filter(Func func) const {
    array<T> result;
    for (size_t i = 0; i < elements_.size(); ++i) {
        if (func(elements_[i], i, *this)) {
            result.push(elements_[i]);
        }
    }
    return result;
}

template<typename T>
template<typename Func, typename U>
U array<T>::reduce(Func func, U initial) const {
    U accumulator = initial;
    for (size_t i = 0; i < elements_.size(); ++i) {
        accumulator = func(accumulator, elements_[i], i, *this);
    }
    return accumulator;
}

template<typename T>
template<typename Func>
T array<T>::reduce(Func func) const {
    if (elements_.empty()) throw std::runtime_error("Reduce of empty array with no initial value");
    
    T accumulator = elements_[0];
    for (size_t i = 1; i < elements_.size(); ++i) {
        accumulator = func(accumulator, elements_[i], i, *this);
    }
    return accumulator;
}

template<typename T>
template<typename Func, typename U>
U array<T>::reduceRight(Func func, U initial) const {
    U accumulator = initial;
    for (int i = elements_.size() - 1; i >= 0; --i) {
        accumulator = func(accumulator, elements_[i], i, *this);
    }
    return accumulator;
}

template<typename T>
template<typename Func>
std::optional<T> array<T>::find(Func func) const {
    for (size_t i = 0; i < elements_.size(); ++i) {
        if (func(elements_[i], i, *this)) {
            return elements_[i];
        }
    }
    return std::nullopt;
}

template<typename T>
template<typename Func>
int array<T>::findIndex(Func func) const {
    for (size_t i = 0; i < elements_.size(); ++i) {
        if (func(elements_[i], i, *this)) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

template<typename T>
int array<T>::indexOf(const T& searchElement, size_t fromIndex) const {
    for (size_t i = fromIndex; i < elements_.size(); ++i) {
        if (elements_[i] == searchElement) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

template<typename T>
int array<T>::lastIndexOf(const T& searchElement, size_t fromIndex) const {
    size_t startIndex = (fromIndex == std::string::npos) ? elements_.size() - 1 : std::min(fromIndex, elements_.size() - 1);
    
    for (int i = static_cast<int>(startIndex); i >= 0; --i) {
        if (elements_[i] == searchElement) {
            return i;
        }
    }
    return -1;
}

template<typename T>
bool array<T>::includes(const T& searchElement, size_t fromIndex) const {
    return indexOf(searchElement, fromIndex) != -1;
}

template<typename T>
template<typename Func>
bool array<T>::every(Func func) const {
    for (size_t i = 0; i < elements_.size(); ++i) {
        if (!func(elements_[i], i, *this)) {
            return false;
        }
    }
    return true;
}

template<typename T>
template<typename Func>
bool array<T>::some(Func func) const {
    for (size_t i = 0; i < elements_.size(); ++i) {
        if (func(elements_[i], i, *this)) {
            return true;
        }
    }
    return false;
}

template<typename T>
array<string> array<T>::toStringArray() const {
    array<string> result;
    for (const auto& element : elements_) {
        result.push(detail::stringify(element));
    }
    return result;
}

template<typename T>
template<typename... Args>
array<T> array<T>::of(Args&&... args) {
    return array<T>{std::forward<Args>(args)...};
}

template<typename T>
template<typename Container>
array<T> array<T>::from(const Container& arrayLike) {
    array<T> result;
    for (const auto& item : arrayLike) {
        result.push(item);
    }
    return result;
}

template<typename T>
array<any> array<T>::flat(size_t depth) const {
    array<any> result;
    // Simplified flat implementation - full implementation would be recursive
    for (const auto& element : elements_) {
        result.push(any(element));
    }
    return result;
}

template<typename T>
template<typename Func>
auto array<T>::flatMap(Func func) const -> array<typename std::decay<decltype(func(std::declval<T>()))>::type> {
    using ReturnType = typename std::decay<decltype(func(std::declval<T>()))>::type;
    array<ReturnType> result;
    
    for (size_t i = 0; i < elements_.size(); ++i) {
        auto mapped = func(elements_[i], i, *this);
        // If mapped is an array, flatten it
        if constexpr (std::is_same_v<ReturnType, array<typename ReturnType::value_type>>) {
            for (const auto& item : mapped) {
                result.push(item);
            }
        } else {
            result.push(mapped);
        }
    }
    return result;
}

} // namespace js

#endif // TYPESCRIPT2CXX_RUNTIME_CORE_H