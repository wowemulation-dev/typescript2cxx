#ifndef KEYOF_OPERATOR_TEST_H
#define KEYOF_OPERATOR_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

// Interface Person
class IPerson {
public:
    virtual ~IPerson() = default;
    // TODO: Interface members
};
js::any getProperty(Person person, PersonKeys key);
template<typename T>
js::array<js::string> getKeys(T obj);
// Interface StringMap
class IStringMap {
public:
    virtual ~IStringMap() = default;
    // TODO: Interface members
};
// Interface NumberArray
class INumberArray {
public:
    virtual ~INumberArray() = default;
    // TODO: Interface members
};
auto main();

#endif // KEYOF_OPERATOR_TEST_H