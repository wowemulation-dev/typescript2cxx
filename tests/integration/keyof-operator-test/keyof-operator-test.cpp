#include "keyof-operator-test.h"

using namespace js;

js::any getProperty(Person person, PersonKeys key) {
    return person[key];
}

template<typename T>
js::array<js::string> getKeys(T obj) {
    return js::object.keys(obj);
}

auto main() {
    const Person person = []() {
          js::object obj_temp_0;
          obj_temp_0.set("name", "John"_S);
          obj_temp_0.set("age", js::number(30));
          obj_temp_0.set("email", "john@example.com"_S);
          return js::any(obj_temp_0);
        }();
    const js::any name = getProperty(person, "name"_S);
    const js::any age = getProperty(person, "age"_S);
    const js::any keys = getKeys(person);
    js::console.log("Person keys:"_S, keys);
    const Point point = []() {
          js::object obj_temp_1;
          obj_temp_1.set("x", js::number(10));
          obj_temp_1.set("y", js::number(20));
          return js::any(obj_temp_1);
        }();
    const js::any pointKeys = getKeys(point);
    js::console.log("Point keys:"_S, pointKeys);
}
