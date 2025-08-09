#include "test-class.h"

using namespace js;

js::number Calculator::add(js::number a, js::number b) {
    {
            return (a + b);
    }
}

js::number Calculator::multiply(js::number a, js::number b) {
    {
            return (a * b);
    }
}

const std::shared_ptr<Calculator> calc = std::make_shared<Calculator>();

// Entry point
void Main() {
    js::console.log(calc->add(js::number(5), js::number(3)));
    js::console.log(calc->multiply(js::number(4), js::number(6)));
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}