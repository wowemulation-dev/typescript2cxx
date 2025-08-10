#ifndef NON_NULL_ASSERTION_TEST_H
#define NON_NULL_ASSERTION_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "runtime/core.h"

using namespace js;

// Forward declarations
class Container;

js::number testBasicNonNull(js::typed::Nullable<js::string> value);
// Interface User
class IUser {
public:
    virtual ~IUser() = default;
    // TODO: Interface members
};
js::string testObjectNonNull(js::typed::Nullable<User> user);
js::string testOptionalNonNull(User user);
// Interface DataStructure
class IDataStructure {
public:
    virtual ~IDataStructure() = default;
    // TODO: Interface members
};
js::string testChainedNonNull(js::typed::Nullable<DataStructure> data);
js::string testNestedNonNull(js::typed::Nullable<DataStructure> data);
js::string testArrayNonNull(js::array<js::typed::Nullable<js::string>> items);
js::typed::Nullable<User> maybeGetUser();
js::string testFunctionNonNull();
class Container {
public:
    Container() = default;
    js::typed::Nullable<js::any> data;
    virtual js::string getValue();
};
js::string testComplexExpression(js::typed::Nullable<js::array<User>> users);
// Interface Service
class IService {
public:
    virtual ~IService() = default;
    // TODO: Interface members
};
js::number _testMethodNonNull(js::typed::Nullable<Service> service);
void main();

#endif // NON_NULL_ASSERTION_TEST_H