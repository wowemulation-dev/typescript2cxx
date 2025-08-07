#ifndef TYPESCRIPT2CXX_RUNTIME_TYPED_WRAPPERS_H
#define TYPESCRIPT2CXX_RUNTIME_TYPED_WRAPPERS_H

#include "core.h"
#include <functional>
#include <optional>
#include <sstream>

namespace js {
namespace typed {

    /**
     * Typed wrappers for common union patterns
     * Provides type-safe alternatives to raw any usage
     */

    /**
     * StringOrNumber - Common union type (string | number)
     */
    class StringOrNumber {
        any _value;
        
    public:
        StringOrNumber() : _value(undefined) {}
        StringOrNumber(const string& s) : _value(s) {}
        StringOrNumber(const number& n) : _value(n) {}
        StringOrNumber(const char* s) : _value(string(s)) {}
        
        template<typename T>
        StringOrNumber(T n, typename std::enable_if<std::is_arithmetic<T>::value>::type* = 0) 
            : _value(number(n)) {}
        
        bool is_string() const { return std::holds_alternative<js::string>(_value); }
        bool is_number() const { return std::holds_alternative<js::number>(_value); }
        
        string as_string() const {
            if (is_string()) return std::get<js::string>(_value);
            if (is_number()) return std::get<js::number>(_value).toString();
            throw std::runtime_error("StringOrNumber is neither string nor number");
        }
        
        number as_number() const {
            if (is_number()) return std::get<js::number>(_value);
            if (is_string()) {
                // Try to parse string as number
                auto str = std::get<js::string>(_value).to_std_string();
                try {
                    return number(std::stod(str));
                } catch (...) {
                    return number(std::numeric_limits<double>::quiet_NaN());
                }
            }
            throw std::runtime_error("Cannot convert to number");
        }
        
        string toString() const { return as_string(); }
        
        operator any() const { return _value; }
        
        // Assignment operators
        StringOrNumber& operator=(const string& s) { _value = s; return *this; }
        StringOrNumber& operator=(const number& n) { _value = n; return *this; }
        StringOrNumber& operator=(const char* s) { _value = string(s); return *this; }
        
        template<typename T>
        typename std::enable_if<std::is_arithmetic<T>::value, StringOrNumber&>::type
        operator=(T n) { _value = number(n); return *this; }
    };

    /**
     * Nullable<T> - Represents T | null | undefined
     */
    template<typename T>
    class Nullable {
        any _value;
        
    public:
        Nullable() : _value(undefined) {}
        Nullable(std::nullptr_t) : _value(null) {}
        Nullable(const undefined_t&) : _value(undefined) {}
        Nullable(const null_t&) : _value(null) {}
        Nullable(const T& value) : _value(value) {}
        Nullable(T&& value) : _value(std::move(value)) {}
        
        bool has_value() const {
            return !std::holds_alternative<undefined_t>(_value) && 
                   !std::holds_alternative<null_t>(_value);
        }
        
        bool is_null() const { return std::holds_alternative<null_t>(_value); }
        bool is_undefined() const { return std::holds_alternative<undefined_t>(_value); }
        
        T value() const {
            if (!has_value()) {
                throw std::runtime_error("Nullable has no value");
            }
            return std::get<T>(_value);
        }
        
        T value_or(const T& default_value) const {
            return has_value() ? std::get<T>(_value) : default_value;
        }
        
        std::optional<T> to_optional() const {
            if (has_value()) {
                return std::get<T>(_value);
            }
            return std::nullopt;
        }
        
        template<typename Func>
        auto map(Func f) -> Nullable<decltype(f(std::declval<T>()))> {
            using R = decltype(f(std::declval<T>()));
            if (has_value()) {
                return Nullable<R>(f(value()));
            }
            return Nullable<R>();
        }
        
        operator any() const { return _value; }
        
        // Assignment operators
        Nullable& operator=(const T& value) { _value = value; return *this; }
        Nullable& operator=(T&& value) { _value = std::move(value); return *this; }
        Nullable& operator=(std::nullptr_t) { _value = null; return *this; }
        Nullable& operator=(const undefined_t&) { _value = undefined; return *this; }
        Nullable& operator=(const null_t&) { _value = null; return *this; }
        
        // Comparison operators
        bool operator==(std::nullptr_t) const { return is_null(); }
        bool operator!=(std::nullptr_t) const { return !is_null(); }
        bool operator==(const undefined_t&) const { return is_undefined(); }
        bool operator!=(const undefined_t&) const { return !is_undefined(); }
    };

    /**
     * Dictionary<T> - Type-safe object with string keys
     */
    template<typename T>
    class Dictionary {
        object _obj;
        
    public:
        Dictionary() : _obj() {}
        Dictionary(const object& obj) : _obj(obj) {}
        Dictionary(std::initializer_list<std::pair<string, T>> init) {
            for (const auto& pair : init) {
                set(pair.first, pair.second);
            }
        }
        
        void set(const string& key, const T& value) {
            _obj[key] = value;
        }
        
        std::optional<T> get(const string& key) const {
            if (_obj.has_property(key)) {
                try {
                    return std::get<T>(_obj[key]);
                } catch (...) {
                    return std::nullopt;
                }
            }
            return std::nullopt;
        }
        
        T get_or(const string& key, const T& default_value) const {
            auto val = get(key);
            return val.has_value() ? val.value() : default_value;
        }
        
        bool has(const string& key) const {
            return _obj.has_property(key);
        }
        
        void remove(const string& key) {
            // TODO: Implement object property deletion
        }
        
        operator object() const { return _obj; }
        operator any() const { return _obj; }
    };

    /**
     * SafeArray<T> - Array with type checking
     */
    template<typename T>
    class SafeArray {
        array<any> _arr;
        
    public:
        SafeArray() : _arr() {}
        SafeArray(const array<any>& arr) : _arr(arr) { validate(); }
        SafeArray(std::initializer_list<T> init) {
            for (const auto& item : init) {
                _arr.push(item);
            }
        }
        
        void push(const T& value) {
            _arr.push(value);
        }
        
        std::optional<T> at(size_t index) const {
            if (index < _arr.length()) {
                try {
                    return std::get<T>(_arr[index]);
                } catch (...) {
                    return std::nullopt;
                }
            }
            return std::nullopt;
        }
        
        T at_or(size_t index, const T& default_value) const {
            auto val = at(index);
            return val.has_value() ? val.value() : default_value;
        }
        
        size_t length() const { return _arr.length(); }
        
        void validate() const {
            for (size_t i = 0; i < _arr.length(); ++i) {
                if (!std::holds_alternative<T>(_arr[i])) {
                    throw std::runtime_error("Invalid type in SafeArray at index " + std::to_string(i));
                }
            }
        }
        
        array<T> to_typed_array() const {
            array<T> result;
            for (size_t i = 0; i < _arr.length(); ++i) {
                result.push(std::get<T>(_arr[i]));
            }
            return result;
        }
        
        operator array<any>() const { return _arr; }
        operator any() const { return _arr; }
    };

    /**
     * Result<T, E> - Type-safe error handling
     */
    template<typename T, typename E = string>
    class Result {
        std::variant<T, E> _value;
        bool _is_ok;
        
    public:
        static Result<T, E> ok(const T& value) {
            Result<T, E> r;
            r._value = value;
            r._is_ok = true;
            return r;
        }
        
        static Result<T, E> err(const E& error) {
            Result<T, E> r;
            r._value = error;
            r._is_ok = false;
            return r;
        }
        
        bool is_ok() const { return _is_ok; }
        bool is_err() const { return !_is_ok; }
        
        T value() const {
            if (!_is_ok) {
                throw std::runtime_error("Result is an error");
            }
            return std::get<T>(_value);
        }
        
        E error() const {
            if (_is_ok) {
                throw std::runtime_error("Result is not an error");
            }
            return std::get<E>(_value);
        }
        
        T value_or(const T& default_value) const {
            return _is_ok ? std::get<T>(_value) : default_value;
        }
        
        template<typename Func>
        auto map(Func f) -> Result<decltype(f(std::declval<T>())), E> {
            using R = decltype(f(std::declval<T>()));
            if (_is_ok) {
                return Result<R, E>::ok(f(std::get<T>(_value)));
            }
            return Result<R, E>::err(std::get<E>(_value));
        }
    };

} // namespace typed
} // namespace js

#endif // TYPESCRIPT2CXX_RUNTIME_TYPED_WRAPPERS_H