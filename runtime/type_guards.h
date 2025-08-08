#ifndef TYPESCRIPT2CXX_RUNTIME_TYPE_GUARDS_H
#define TYPESCRIPT2CXX_RUNTIME_TYPE_GUARDS_H

#include "core.h"
#include <typeinfo>
#include <algorithm>

namespace js {
namespace type_guards {

    /**
     * typeof operator implementation
     * Returns JavaScript-compatible type strings
     */
    inline string typeof_impl(const any& value) {
        if (value.is<undefined_t>()) {
            return "undefined";
        }
        if (value.is<null_t>()) {
            return "object"; // typeof null === "object" in JavaScript
        }
        if (value.is<bool>()) {
            return "boolean";
        }
        if (value.is<js::number>()) {
            return "number";
        }
        if (value.is<js::string>()) {
            return "string";
        }
        if (value.is<js::object>()) {
            return "object";
        }
        // TODO: Add function type checking when js::function is available
        // For now, assume objects might be functions
        return "object";
    }

    /**
     * Type predicate functions
     */
    inline bool is_string(const any& value) {
        return value.is<js::string>();
    }
    
    inline bool is_number(const any& value) {
        return value.is<js::number>();
    }
    
    inline bool is_boolean(const any& value) {
        return value.is<bool>();
    }
    
    inline bool is_undefined(const any& value) {
        return value.is<undefined_t>();
    }
    
    inline bool is_null(const any& value) {
        return value.is<null_t>();
    }
    
    inline bool is_null_or_undefined(const any& value) {
        return is_null(value) || is_undefined(value);
    }
    
    inline bool is_object(const any& value) {
        return value.is<js::object>() || value.is<null_t>(); // typeof null === "object"
    }
    
    // Type guard for nullable values
    template<typename T>
    inline bool is_nullable(const any& value) {
        return is_null(value) || is_undefined(value) || value.is<T>();
    }
    
    // Check if value is one of multiple types
    template<typename... Types>
    inline bool is_one_of(const any& value) {
        return (value.is<Types>() || ...);
    }
    
    // Check if array contains all elements of specific type
    template<typename T>
    inline bool is_array_of(const any& value) {
        if (!value.is<js::array<js::any>>()) {
            return false;
        }
        
        auto arr = value.get<js::array<js::any>>();
        return std::all_of(arr.begin(), arr.end(), 
            [](const any& item) { return item.is<T>(); });
    }

} // namespace type_guards

// Global typeof function for use in generated code
inline string typeof(const any& value) {
    return type_guards::typeof_impl(value);
}

// Alias for code generator compatibility
inline string typeof_op(const any& value) {
    return type_guards::typeof_impl(value);
}

// Global nullish coalescing helper for logical assignment operators
inline bool is_null_or_undefined(const any& value) {
    return type_guards::is_null_or_undefined(value);
}

// JavaScript-style truthiness helper for logical assignment operators
inline bool to_boolean(const any& value) {
    if (value.is<undefined_t>() || value.is<null_t>()) {
        return false;
    }
    if (value.is<bool>()) {
        return value.get<bool>();
    }
    if (value.is<js::number>()) {
        double num = value.get<js::number>().value();
        return num != 0.0 && !std::isnan(num);
    }
    if (value.is<js::string>()) {
        return !value.get<js::string>().empty();
    }
    // Objects are truthy
    return true;
}

// Overloads for direct types to avoid unnecessary any conversions
inline bool to_boolean(const js::string& value) {
    return !value.empty();
}

inline bool to_boolean(const js::number& value) {
    double num = value.value();
    return num != 0.0 && !std::isnan(num);
}

inline bool to_boolean(bool value) {
    return value;
}

inline bool to_boolean(const null_t&) {
    return false;
}

inline bool to_boolean(const undefined_t&) {
    return false;
}

} // namespace js

#endif // TYPESCRIPT2CXX_RUNTIME_TYPE_GUARDS_H