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
        if (std::holds_alternative<undefined_t>(value)) {
            return "undefined";
        }
        if (std::holds_alternative<null_t>(value)) {
            return "object"; // typeof null === "object" in JavaScript
        }
        if (std::holds_alternative<bool>(value)) {
            return "boolean";
        }
        if (std::holds_alternative<js::number>(value)) {
            return "number";
        }
        if (std::holds_alternative<js::string>(value)) {
            return "string";
        }
        if (std::holds_alternative<js::object>(value)) {
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
        return std::holds_alternative<js::string>(value);
    }
    
    inline bool is_number(const any& value) {
        return std::holds_alternative<js::number>(value);
    }
    
    inline bool is_boolean(const any& value) {
        return std::holds_alternative<bool>(value);
    }
    
    inline bool is_undefined(const any& value) {
        return std::holds_alternative<undefined_t>(value);
    }
    
    inline bool is_null(const any& value) {
        return std::holds_alternative<null_t>(value);
    }
    
    inline bool is_object(const any& value) {
        return std::holds_alternative<js::object>(value) || 
               std::holds_alternative<null_t>(value); // typeof null === "object"
    }
    
    // Type guard for nullable values
    template<typename T>
    inline bool is_nullable(const any& value) {
        return is_null(value) || is_undefined(value) || std::holds_alternative<T>(value);
    }
    
    // Check if value is one of multiple types
    template<typename... Types>
    inline bool is_one_of(const any& value) {
        return (std::holds_alternative<Types>(value) || ...);
    }
    
    // Check if array contains all elements of specific type
    template<typename T>
    inline bool is_array_of(const any& value) {
        if (!std::holds_alternative<js::array<js::any>>(value)) {
            return false;
        }
        
        auto arr = std::get<js::array<js::any>>(value);
        return std::all_of(arr.begin(), arr.end(), 
            [](const any& item) { return std::holds_alternative<T>(item); });
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

} // namespace js

#endif // TYPESCRIPT2CXX_RUNTIME_TYPE_GUARDS_H