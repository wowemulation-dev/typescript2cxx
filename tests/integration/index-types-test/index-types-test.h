#ifndef INDEX_TYPES_TEST_H
#define INDEX_TYPES_TEST_H

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
template<typename T, typename K>
js::any getProperty(T obj, K key);
// Interface StringDictionary
class IStringDictionary {
public:
    virtual ~IStringDictionary() = default;
    // TODO: Interface members
};
// Interface NumberDictionary
class INumberDictionary {
public:
    virtual ~INumberDictionary() = default;
    // TODO: Interface members
};
// Interface MixedDictionary
class IMixedDictionary {
public:
    virtual ~IMixedDictionary() = default;
    // TODO: Interface members
};
extern const Person person;
extern const js::any name;
extern const js::any age;
extern const StringDictionary dict;
extern const NumberDictionary arr;
extern const MixedDictionary mixed;
template<typename T, typename K>
Pick pickProperties(T obj, js::array<K> keys);
extern const js::any nameAndAge;
template<typename T, typename K>
js::array<js::any> pluck(js::array<T> objects, K key);
extern js::array<Person> people;
extern const js::any names;
extern const js::any ages;

#endif // INDEX_TYPES_TEST_H