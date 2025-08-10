#ifndef MAPPED_TYPES_TEST_H
#define MAPPED_TYPES_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

// Interface Person
class IPerson {
public:
    virtual ~IPerson() = default;
    // TODO: Interface members
};
Person makeReadonly(Person person);
// Interface PartialPerson
class IPartialPerson {
public:
    virtual ~IPartialPerson() = default;
    // TODO: Interface members
};
Person updatePartial(Person person, PartialPerson updates);
// Interface NullablePerson
class INullablePerson {
public:
    virtual ~INullablePerson() = default;
    // TODO: Interface members
};
Person requireAll(PartialPerson partial);
// Interface PersonName
class IPersonName {
public:
    virtual ~IPersonName() = default;
    // TODO: Interface members
};
PersonName getPersonName(Person person);
// Interface PersonWithoutEmail
class IPersonWithoutEmail {
public:
    virtual ~IPersonWithoutEmail() = default;
    // TODO: Interface members
};
PersonWithoutEmail removeEmail(Person person);
auto main();

#endif // MAPPED_TYPES_TEST_H