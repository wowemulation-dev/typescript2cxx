#ifndef CLASS_INHERITANCE_H
#define CLASS_INHERITANCE_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

// Forward declarations
class Animal;
class Dog;

class Animal {
public:
    js::string name;
    Animal(js::string name);
    virtual void speak();
};
class Dog : public Animal {
public:
    Dog(js::string name);
    void speak() override;
};
extern const std::shared_ptr<Dog> dog;

#endif // CLASS_INHERITANCE_H