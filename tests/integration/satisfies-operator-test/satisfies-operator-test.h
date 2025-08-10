#ifndef SATISFIES_OPERATOR_TEST_H
#define SATISFIES_OPERATOR_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "runtime/core.h"

using namespace js;

extern const js::any colors;
extern const js::string _redColor;
extern const js::any config;
extern const js::any _port;
extern const js::any routes;
auto getConfig();
extern const js::any apiConfig;
extern const js::string currentStatus;
extern js::array<js::number> _numbers;
extern js::array<js::number> _mixedArray;
extern const js::any user;
// Interface UserProfile
class IUserProfile {
public:
    virtual ~IUserProfile() = default;
    // TODO: Interface members
};
extern const js::any profile;
// Interface Container
class IContainer {
public:
    virtual ~IContainer() = default;
    // TODO: Interface members
};
extern const js::any _stringContainer;
extern const js::any preferences;

#endif // SATISFIES_OPERATOR_TEST_H