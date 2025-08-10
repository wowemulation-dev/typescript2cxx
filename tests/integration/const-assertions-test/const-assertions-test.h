#ifndef CONST_ASSERTIONS_TEST_H
#define CONST_ASSERTIONS_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

extern const js::string literalString;
extern const js::number _literalNumber;
extern const bool _literalBoolean;
extern const js::any config;
extern const js::array<js::string> colors;
extern const js::array<js::number> _numbers;
extern const js::array<js::string> _mixed;
extern const js::array<js::number> _tuple;
extern const js::any _nested;
auto getConfig();
extern const js::any serverConfig;
extern const js::string prefix;
extern const js::string version;
extern const js::any endpoint;
auto processColors(js::any colors);
extern const js::any _result;
extern const js::any action1;
extern const js::any action2;
extern const js::any action3;
auto handleAction(Action action);
extern const js::any Direction;
extern const js::any DATABASE_CONFIG;
auto connectToDatabase(DatabaseConfig config);
extern const js::any routes;
auto navigateTo(js::any route);

#endif // CONST_ASSERTIONS_TEST_H