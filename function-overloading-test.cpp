#include "function-overloading-test.h"

using namespace js;

js::string processValue(js::string value) {
}

js::number processValue(js::number value) {
}

js::string processValue(bool value) {
}

js::typed::StringOrNumber processValue(js::any value) {
    if (js::typeof_op(value) === "string"_S) {
            {
                        return value.toUpperCase();
            }
    } else {
            if (js::typeof_op(value) === "number"_S) {
                        {
                                        return (value * js::number(2));
                        }
            } else {
                        {
                                        return (js::null ? js::null : js::null);
                        }
            }
    }
}

js::number Calculator::add(js::number a, js::number b) {
    {
    }
}

js::string Calculator::add(js::string a, js::string b) {
    {
    }
}

js::typed::StringOrNumber Calculator::add(js::typed::StringOrNumber a, js::typed::StringOrNumber b) {
    {
            if ((js::typeof_op(a) === "number"_S && js::typeof_op(b) === "number"_S)) {
                        {
                                        return (a + b);
                        }
            }
            return (String(a) + String(b));
    }
}

js::number Calculator::multiply(js::number value) {
    {
    }
}

js::number Calculator::multiply(js::number value, js::number times) {
    {
    }
}

js::number Calculator::multiply(js::number value, std::optional<js::number> times) {
    {
            return (js::null ? js::null : js::null);
    }
}

void testFunctionOverloading() {
    const js::any stringResult = processValue("hello"_S);
    const js::any numberResult = processValue(js::number(42));
    const js::any boolResult = processValue(true);
    const std::shared_ptr<Calculator> calc = std::make_shared<Calculator>();
    const js::any numSum = calc->add(js::number(10), js::number(20));
    const js::any strSum = calc->add("hello"_S, "world"_S);
    const js::any square = calc->multiply(js::number(5));
    const js::any product = calc->multiply(js::number(5), js::number(3));
    js::console.log("Overloading tests:"_S, []() {
          js::object obj_temp_0;
          obj_temp_0.set("stringResult", stringResult);
          obj_temp_0.set("numberResult", numberResult);
          obj_temp_0.set("boolResult", boolResult);
          obj_temp_0.set("numSum", numSum);
          obj_temp_0.set("strSum", strSum);
          obj_temp_0.set("square", square);
          obj_temp_0.set("product", product);
          return js::any(obj_temp_0);
        }());
}

// Entry point
void Main() {
    testFunctionOverloading();
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}