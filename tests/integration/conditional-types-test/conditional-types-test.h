#ifndef CONDITIONAL_TYPES_TEST_H
#define CONDITIONAL_TYPES_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

template<typename T>
js::typed::StringOrNumber processValue(T value);
bool isString(js::any value);
js::typed::Nullable<js::string> extractString(js::any value);
template<typename T>
js::typed::Nullable<T> removeNull(js::any value);
auto main();

#endif // CONDITIONAL_TYPES_TEST_H