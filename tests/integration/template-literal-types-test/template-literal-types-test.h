#ifndef TEMPLATE_LITERAL_TYPES_TEST_H
#define TEMPLATE_LITERAL_TYPES_TEST_H

#include <iostream>
#include <string>
#include <memory>
#include <vector>
#include <map>
#include <optional>
#include <initializer_list>
#include "core.h"

using namespace js;

template<typename T>
T makeWatchedObject(T obj);
extern const js::any person;
auto sendEmail(EmailDomain email);
auto fetchFromAPI(URLPath url);
// Interface Person
class IPerson {
public:
    virtual ~IPerson() = default;
    // TODO: Interface members
};
PersonEventHandlers createEventHandler();
extern const js::any handlers;

#endif // TEMPLATE_LITERAL_TYPES_TEST_H