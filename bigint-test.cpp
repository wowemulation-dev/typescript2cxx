#include "bigint-test.h"

using namespace js;

const js::bigint smallBigInt = js::bigint("42");

const js::bigint largeBigInt = js::bigint("9007199254740991");

const js::any negativeBigInt = -js::bigint("123");

void testBigIntOperations() {
    const js::number sum = (js::bigint("10") + js::bigint("20"));
    const js::number diff = (js::bigint("100") - js::bigint("50"));
    const js::number product = (js::bigint("6") * js::bigint("7"));
    const js::number quotient = (js::bigint("84") / js::bigint("2"));
    const js::any isEqual = js::bigint("42") === js::bigint("42");
    const bool isLess = (js::bigint("10") < js::bigint("20"));
    const bool isGreater = (js::bigint("30") > js::bigint("20"));
    const js::number mixed = (BigInt(js::number(123)) + js::bigint("456"));
    js::console.log("BigInt tests:"_S, []() {
          js::object obj_temp_0;
          obj_temp_0.set("smallBigInt", smallBigInt);
          obj_temp_0.set("largeBigInt", largeBigInt);
          obj_temp_0.set("negativeBigInt", negativeBigInt);
          obj_temp_0.set("sum", sum);
          obj_temp_0.set("diff", diff);
          obj_temp_0.set("product", product);
          obj_temp_0.set("quotient", quotient);
          obj_temp_0.set("isEqual", isEqual);
          obj_temp_0.set("isLess", isLess);
          obj_temp_0.set("isGreater", isGreater);
          obj_temp_0.set("mixed", mixed);
          return js::any(obj_temp_0);
        }());
}

// Entry point
void Main() {
    testBigIntOperations();
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}