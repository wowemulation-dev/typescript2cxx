#ifndef NON_NULL_DEBUG_TEST_H
#define NON_NULL_DEBUG_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "runtime/core.h"

using namespace js;

js::number testSimple(js::typed::Nullable<js::string> value);
js::number testNonNull(js::typed::Nullable<js::string> value);
void main();

#endif // NON_NULL_DEBUG_TEST_H