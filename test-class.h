#ifndef TEST_CLASS_H
#define TEST_CLASS_H

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

class Calculator {
public:
    Calculator() = default;
    js::number add(js::number a, js::number b);
    js::number multiply(js::number a, js::number b);
};
extern const std::shared_ptr<Calculator> calc;

#endif // TEST_CLASS_H