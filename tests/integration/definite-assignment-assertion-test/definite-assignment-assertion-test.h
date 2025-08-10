#ifndef DEFINITE_ASSIGNMENT_ASSERTION_TEST_H
#define DEFINITE_ASSIGNMENT_ASSERTION_TEST_H

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
class BasicClass;
class ConfigManager;
class BaseService;
class UserService;
class Container;
class StaticExample;
class MixedProperties;
class ReadonlyExample;

class BasicClass {
public:
    js::string value;
    js::number count;
    bool optional;
    BasicClass();
    virtual auto updateValue(js::string newValue);
    virtual js::string getValue();
};
// Interface Config
class IConfig {
public:
    virtual ~IConfig() = default;
    // TODO: Interface members
};
class ConfigManager {
public:
    ConfigManager() = default;
    js::string apiUrl;
    js::number timeout;
    bool debug;
    bool initialized;
    js::any settings;
    virtual auto initialize(js::string url, js::number timeoutMs);
    virtual bool isReady();
};
class BaseService {
public:
    BaseService() = default;
    js::string serviceName;
    js::number version;
    virtual void init() = 0;
    virtual js::string getInfo();
};
class UserService : public BaseService {
public:
    UserService() = default;
    js::number userCount;
    void init() override;
    void addUser() override;
};
template<typename T>
class Container {
public:
    Container() = default;
    std::shared_ptr<T> data;
    js::number size;
    js::number capacity;
    virtual void initialize(T item, js::number cap);
    virtual T getData();
};
class StaticExample {
public:
    js::any globalConfig;
    bool initialized;
    js::string instanceData;
    void setup();
    StaticExample(js::string data);
};
class MixedProperties {
public:
    MixedProperties() = default;
    js::string definiteString;
    js::number definiteNumber;
    bool definiteBoolean;
    js::any definiteObject;
    js::array<js::string> definiteArray;
    js::string optionalString;
    js::number optionalNumber;
    js::string regularString;
    js::number regularNumber;
    virtual void setup();
};
class ReadonlyExample {
public:
    js::number id;
    js::string name;
    js::Date created;
    ReadonlyExample(js::number id, js::string name);
};
void main();

#endif // DEFINITE_ASSIGNMENT_ASSERTION_TEST_H