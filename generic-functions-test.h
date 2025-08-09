#ifndef GENERIC_FUNCTIONS_TEST_H
#define GENERIC_FUNCTIONS_TEST_H

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
class Container;

template<typename T>
T identity(T value);
template<typename T>
js::number getLength(T item);
template<typename T, typename U>
js::any swap(T a, U b);
template<typename T>
js::array<T> createArray(js::number size, T defaultValue);
template<typename T>
class Container {
public:
    Container(T initialValue);
    virtual T getValue();
    virtual void setValue(T newValue);
    virtual Container transform(std::function<U(T)> fn);
private:
    std::shared_ptr<T> value;
};
// Interface Pair
class IPair {
public:
    virtual ~IPair() = default;
    // TODO: Interface members
};
template<typename T, typename U>
Pair createPair(T first, U second);
void testGenericFunctions();

#endif // GENERIC_FUNCTIONS_TEST_H