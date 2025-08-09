#include "conditional-types-test.h"

using namespace js;

template<typename T>
js::typed::StringOrNumber processValue(T value) {
    if (js::typeof_op(value) === "string"_S) {
            {
                        return value.toUpperCase();
            }
    }
    return js::number(42);
}

bool isString(js::any value) {
    return js::typeof_op(value) === "string"_S;
}

js::typed::Nullable<js::string> extractString(js::any value) {
    if (js::typeof_op(value) === "string"_S) {
            {
                        return value;
            }
    }
    return js::null;
}

template<typename T>
js::typed::Nullable<T> removeNull(js::any value) {
    if ((value !== js::null && value !== js::undefined)) {
            {
                        return value;
            }
    }
    return js::undefined;
}

auto main() {
    const js::any stringResult = processValue("hello"_S);
    const js::any numberResult = processValue(js::number(123));
    js::console.log("String result:"_S, stringResult);
    js::console.log("Number result:"_S, numberResult);
    const js::typed::StringOrNumber mixed = "test"_S;
    if (isString(mixed)) {
            {
                        js::console.log("Is string:"_S, mixed);
            }
    }
    const js::any extracted = extractString("hello"_S);
    if (extracted !== js::null) {
            {
                        js::console.log("Extracted string:"_S, extracted);
            }
    }
    const js::typed::Nullable<js::string> value = "not null"_S;
    const js::any nonNull = removeNull(value);
    if (nonNull !== js::undefined) {
            {
                        js::console.log("Non-null value:"_S, nonNull);
            }
    }
    const js::typed::Nullable<js::string> nullValue = js::null;
    const js::any result = removeNull(nullValue);
    js::console.log("Result from null:"_S, result);
}
