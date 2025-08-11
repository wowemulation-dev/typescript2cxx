#ifndef TUPLE_TYPES_TEST_H
#define TUPLE_TYPES_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "runtime/core.h"
#include <tuple>

using namespace js;

extern const std::tuple<js::number, js::number> coordinates;
extern const std::tuple<js::number, js::number, js::number> point3D;
extern const std::tuple<js::string, js::number, bool> mixedTuple;
extern const NamedCoordinate namedPoint;
extern const std::tuple<js::string, std::optional<js::number>> optionalTuple;
extern const std::tuple<js::string, std::optional<js::number>> optionalWithValue;
extern const std::tuple<js::string> tupleWithRest;
extern const std::tuple<bool, js::string> anotherRest;
std::tuple<js::number, js::number> getCoordinates();
js::number processPoint(std::tuple<js::number, js::number> point);
extern const js::any _firstCoord;
extern const js::any _secondCoord;
extern js::array<std::tuple<js::number, js::number>> _points;
extern const std::tuple<js::string, std::tuple<js::number, bool>> _nestedTuple;
extern const std::tuple<std::tuple<js::string, js::number>, std::tuple<bool, js::string>> _tripleNested;
template<typename... Args>
void processRestTuple(Args... args);

#endif // TUPLE_TYPES_TEST_H