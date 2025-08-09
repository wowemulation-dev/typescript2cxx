#include "private-fields-test.h"

using namespace js;

TestClass::TestClass(js::number value) {
    {
            this->tsPrivate = value;
            this->jsPrivate = (value * js::number(2));
    }
}

js::number TestClass::unknown() {
    {
            return this->jsPrivate;
    }
}

auto TestClass::getValues() {
    {
            return []() {
                  js::object obj_temp_0;
                  obj_temp_0.set("ts", this->tsPrivate);
                  obj_temp_0.set("js", this->jsPrivate);
                  obj_temp_0.set("method", this->jsPrivateMethod());
                  return js::any(obj_temp_0);
                }();
    }
}

js::number TestClass::jsPrivateMethod() {
    {
            return (this->jsPrivate + js::number(1));
    }
}

const std::shared_ptr<TestClass> obj = std::make_shared<TestClass>(js::number(5));

void Main() {
    js::console.log(obj->getValues());
}
