#include "class-inheritance.h"

using namespace js;

Animal::Animal(js::string name) {
    {
            this->name = name;
    }
}

void Animal::speak() {
    {
            js::console.log((this->name + " makes a sound"_S));
    }
}

Dog::Dog(js::string name) : Animal(name) {
    {
    }
}

void Dog::speak() {
    {
            js::console.log((this->name + " barks"_S));
    }
}

const std::shared_ptr<Dog> dog = std::make_shared<Dog>("Rex"_S);

// Entry point
void Main() {
    dog->speak();
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}