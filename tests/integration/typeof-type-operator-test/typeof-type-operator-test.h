#ifndef TYPEOF_TYPE_OPERATOR_TEST_H
#define TYPEOF_TYPE_OPERATOR_TEST_H

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
class User;

extern const js::string stringValue;
extern const js::number numberValue;
extern const bool booleanValue;
extern const js::any objectValue;
extern js::array<js::number> arrayValue;
extern const js::any anotherString;
extern const js::any anotherNumber;
extern const js::any anotherObject;
extern const js::any config;
js::string greet(js::string name);
extern const js::any multiply;
extern const js::any myGreet;
extern const js::any myMultiply;
class User {
public:
    User(js::string name, js::number age);
    virtual js::string greet();
};
extern const std::shared_ptr<User> userInstance;
template<typename T, typename... Args>
T createInstance(js::any ctor, Args... args);
extern const js::any newUser;
extern js::array<js::number> numbers;
extern js::array<js::string> tuple;
// Enum Color
namespace Color {
    extern const js::string Red;
    extern const js::string Green;
    extern const js::string Blue;
}

extern const js::any myColor;
extern const js::any anotherColor;
template<typename T, typename K>
js::any _getProperty(T obj, K key);
extern const js::any person;
void updatePerson(Partial updates);
extern const js::any Utils;
extern const js::any symbolKey;
extern const js::any complexObject;
js::array<js::number> processData(js::any obj);
extern const js::any result;
extern const js::any action1;
extern const js::any action2;
void handleAction(ActionType action);
auto getData();
extern const DataType myData;

#endif // TYPEOF_TYPE_OPERATOR_TEST_H