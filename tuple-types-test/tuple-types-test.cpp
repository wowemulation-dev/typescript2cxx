#include "tuple-types-test.h"

using namespace js;

const std::tuple<js::number, js::number> coordinates = js::array<js::number>{js::number(10), js::number(20)};

const std::tuple<js::number, js::number, js::number> point3D = js::array<js::number>{js::number(1), js::number(2), js::number(3)};

const std::tuple<js::string, js::number, bool> mixedTuple = js::array<js::string>{"hello"_S, js::number(42), true};

const NamedCoordinate namedPoint = js::array<js::number>{js::number(5), js::number(10)};

const std::tuple<js::string, std::optional<js::number>> optionalTuple = js::array<js::string>{"required"_S};

const std::tuple<js::string, std::optional<js::number>> optionalWithValue = js::array<js::string>{"with"_S, js::number(123)};

const std::tuple<js::string> tupleWithRest = js::array<js::string>{"first"_S, js::number(1), js::number(2), js::number(3), js::number(4), js::number(5)};

const std::tuple<bool, js::string> anotherRest = js::array<bool>{true, "hello"_S, "world"_S, "!"_S};

std::tuple<js::number, js::number> getCoordinates() {
    return js::array<js::number>{js::number(100), js::number(200)};
}

js::number processPoint(std::tuple<js::number, js::number> point) {
    auto _temp9803 = point;
    const auto x = _temp9803[0];
    const auto y = _temp9803[1];
    return (x + y);
}

auto _temp9771 = coordinates;
const auto x1 = _temp9771[0];
const auto y1 = _temp9771[1];

auto _temp8009 = mixedTuple;
const auto _str = _temp8009[0];
const auto _num = _temp8009[1];
const auto _bool = _temp8009[2];

const js::any _firstCoord = coordinates[js::number(0)];

const js::any _secondCoord = coordinates[js::number(1)];

js::array<std::tuple<js::number, js::number>> _points = js::array<js::any>{js::array<js::number>{js::number(0), js::number(0)}, js::array<js::number>{js::number(1), js::number(1)}, js::array<js::number>{js::number(2), js::number(4)}, js::array<js::number>{js::number(3), js::number(9)}};

const std::tuple<js::string, std::tuple<js::number, bool>> _nestedTuple = js::array<js::string>{"outer"_S, js::array<js::number>{js::number(42), false}};

const std::tuple<std::tuple<js::string, js::number>, std::tuple<bool, js::string>> _tripleNested = js::array<js::any>{js::array<js::string>{"a"_S, js::number(1)}, js::array<bool>{true, "b"_S}};

template<typename... Args>
void processRestTuple(Args... args) {
    auto args_array = js::array<js::any>{args...};
    auto _temp4366 = args_array;
    const auto str = _temp4366[0];
    const auto num = _temp4366[1];
    const auto bools = _temp4366.slice(2);
    js::console.log("String:"_S, str);
    js::console.log("Number:"_S, num);
    js::console.log("Booleans:"_S, bools);
}

auto _temp7021 = getCoordinates();
const auto resultX = _temp7021[0];
const auto resultY = _temp7021[1];

// Entry point
void Main() {
    js::console.log("Destructured coordinates:"_S, x1, y1);
    js::console.log("Coordinates:"_S, coordinates);
    js::console.log("Point 3D:"_S, point3D);
    js::console.log("Mixed tuple:"_S, mixedTuple);
    js::console.log("Sum of coordinates:"_S, processPoint(coordinates));
    js::console.log("Result coordinates:"_S, resultX, resultY);
    processRestTuple("test"_S, js::number(42), true, false, true);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}