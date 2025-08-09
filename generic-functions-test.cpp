#include "generic-functions-test.h"

using namespace js;

template<typename T>
T identity(T value) {
    return value;
}

template<typename T>
js::number getLength(T item) {
    return item.length();
}

template<typename T, typename U>
js::any swap(T a, U b) {
    return js::array<js::any>{b, a};
}

template<typename T>
js::array<T> createArray(js::number size, T defaultValue) {
    return std::make_shared<js::array>(size).fill(defaultValue);
}

Container::Container(T initialValue) {
    {
            this->value = initialValue;
    }
}

T Container::getValue() {
    {
            return this->value;
    }
}

void Container::setValue(T newValue) {
    {
            this->value = newValue;
    }
}

Container Container::transform(std::function<U(T)> fn) {
    {
            return std::make_shared<Container>(fn(this->value));
    }
}

template<typename T, typename U>
Pair createPair(T first, U second) {
    return []() {
          js::object obj_temp_0;
          obj_temp_0.set("first", first);
          obj_temp_0.set("second", second);
          return js::any(obj_temp_0);
        }();
}

void testGenericFunctions() {
    const js::any stringIdentity = identity("hello"_S);
    const js::any numberIdentity = identity(js::number(42));
    const js::any boolIdentity = identity(true);
    const js::any strLength = getLength("hello world"_S);
    const js::any arrayLength = getLength(js::array<js::number>{js::number(1), js::number(2), js::number(3), js::number(4), js::number(5)});
    const js::any swapped = swap(js::number(10), "hello"_S);
    const js::any stringArray = createArray(js::number(3), "default"_S);
    const js::any numberArray = createArray(js::number(3), js::number(0));
    const std::shared_ptr<Container> stringContainer = std::make_shared<Container>("initial"_S);
    const js::any transformedContainer = stringContainer->transform([](auto s) -> auto { return s.length(); });
    const js::any pair = createPair("key"_S, js::number(123));
    js::console.log("Generic tests:"_S, []() {
          js::object obj_temp_1;
          obj_temp_1.set("stringIdentity", stringIdentity);
          obj_temp_1.set("numberIdentity", numberIdentity);
          obj_temp_1.set("boolIdentity", boolIdentity);
          obj_temp_1.set("strLength", strLength);
          obj_temp_1.set("arrayLength", arrayLength);
          obj_temp_1.set("swapped", swapped);
          obj_temp_1.set("stringArray", stringArray);
          obj_temp_1.set("numberArray", numberArray);
          obj_temp_1.set("stringValue", stringContainer->getValue());
          obj_temp_1.set("transformedValue", transformedContainer->getValue());
          obj_temp_1.set("pair", pair);
          return js::any(obj_temp_1);
        }());
}

// Entry point
void Main() {
    testGenericFunctions();
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}