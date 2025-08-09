#ifndef PRIVATE_FIELDS_TEST_H
#define PRIVATE_FIELDS_TEST_H

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
class TestClass;

class TestClass {
public:
    TestClass(js::number value);
    virtual js::number unknown();
    virtual auto getValues();
    virtual js::number jsPrivateMethod();
private:
    js::number tsPrivate;
    js::number jsPrivate;
};
extern const std::shared_ptr<TestClass> obj;
void Main();

#endif // PRIVATE_FIELDS_TEST_H