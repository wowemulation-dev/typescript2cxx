#include "mapped-types-test.h"

using namespace js;

Person makeReadonly(Person person) {
    return person;
}

Person updatePartial(Person person, PartialPerson updates) {
    const js::any result = []() {
          js::object obj_temp_0;
          return js::any(obj_temp_0);
        }();
    if (updates["name"] !== js::undefined) {
            {
                        result->name = updates["name"];
            }
    }
    if (updates["age"] !== js::undefined) {
            {
                        result->age = updates["age"];
            }
    }
    if (updates["email"] !== js::undefined) {
            {
                        result->email = updates["email"];
            }
    }
    return result;
}

Person requireAll(PartialPerson partial) {
    if (((!partial["name"] || !partial["age"]) || !partial["email"])) {
            {
                        throw js::any(js::Error("All fields are required"_S));
            }
    }
    return []() {
          js::object obj_temp_1;
          obj_temp_1.set("name", partial["name"]);
          obj_temp_1.set("age", partial["age"]);
          obj_temp_1.set("email", partial["email"]);
          return js::any(obj_temp_1);
        }();
}

PersonName getPersonName(Person person) {
    return []() {
          js::object obj_temp_2;
          obj_temp_2.set("name", person["name"]);
          return js::any(obj_temp_2);
        }();
}

PersonWithoutEmail removeEmail(Person person) {
    return []() {
          js::object obj_temp_3;
          obj_temp_3.set("name", person["name"]);
          obj_temp_3.set("age", person["age"]);
          return js::any(obj_temp_3);
        }();
}

auto main() {
    const Person person = []() {
          js::object obj_temp_4;
          obj_temp_4.set("name", "John"_S);
          obj_temp_4.set("age", js::number(30));
          obj_temp_4.set("email", "john@example.com"_S);
          return js::any(obj_temp_4);
        }();
    const js::any readonlyPerson = makeReadonly(person);
    js::console.log("Readonly person:"_S, readonlyPerson);
    const PartialPerson updates = []() {
          js::object obj_temp_5;
          obj_temp_5.set("age", js::number(31));
          return js::any(obj_temp_5);
        }();
    const js::any updatedPerson = updatePartial(person, updates);
    js::console.log("Original person:"_S, person);
    js::console.log("Updated person:"_S, updatedPerson);
    const NullablePerson nullablePerson = []() {
          js::object obj_temp_6;
          obj_temp_6.set("name", "Jane"_S);
          obj_temp_6.set("age", js::null);
          obj_temp_6.set("email", "jane@example.com"_S);
          return js::any(obj_temp_6);
        }();
    js::console.log("Nullable person:"_S, nullablePerson);
    const js::any nameOnly = getPersonName(person);
    js::console.log("Name only:"_S, nameOnly);
    const js::any withoutEmail = removeEmail(person);
    js::console.log("Without email:"_S, withoutEmail);
    try {
            const js::any required = requireAll([]() {
                  js::object obj_temp_7;
                  obj_temp_7.set("name", "Test"_S);
                  return js::any(obj_temp_7);
                }());
            js::console.log("Required person:"_S, required);
    } catch (const js::any& e) {
            js::console.log("Error:"_S, e);
    }
}
