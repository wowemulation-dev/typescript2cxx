#ifndef FUNCTION_OVERLOADING_TEST_H
#define FUNCTION_OVERLOADING_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

// Forward declarations
class Calculator;

js::string processValue(js::string value);
js::number processValue(js::number value);
js::string processValue(bool value);
js::typed::StringOrNumber processValue(js::any value);
class Calculator {
public:
    Calculator() = default;
    virtual js::number add(js::number a, js::number b);
    virtual js::string add(js::string a, js::string b);
    virtual js::typed::StringOrNumber add(js::typed::StringOrNumber a, js::typed::StringOrNumber b);
    virtual js::number multiply(js::number value);
    virtual js::number multiply(js::number value, js::number times);
    virtual js::number multiply(js::number value, std::optional<js::number> times = std::nullopt);
};
void testFunctionOverloading();

#endif // FUNCTION_OVERLOADING_TEST_H