#include "test-hello.h"

using namespace js;

// Entry point
void Main() {
    js::console.log("Hello, World!"_S);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}