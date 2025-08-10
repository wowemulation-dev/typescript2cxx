#include "non-null-debug-test.h"

using namespace js;

js::number testSimple(js::typed::Nullable<js::string> value) {
    const js::any valueLength = (js::null ? js::null : js::null);
    return valueLength;
}

js::number testNonNull(js::typed::Nullable<js::string> value) {
    return value.length();
}

void main() {
    const js::any _test1 = testSimple("hello"_S);
    const js::any _test2 = testNonNull("world"_S);
}
