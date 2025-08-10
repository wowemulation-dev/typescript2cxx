#include "template-literal-types-test.h"

using namespace js;

template<typename T>
T makeWatchedObject(T obj) {
    const js::any result = []() {
          js::object obj_temp_0;
          return js::any(obj_temp_0);
        }();
    result->on = [](js::string eventName, std::function<void(js::any)> _callback) -> auto {
    js::console.log(("Watching for "_S + js::toString(eventName)));
    };
    return result;
}

const js::any person = makeWatchedObject([]() {
      js::object obj_temp_1;
      obj_temp_1.set("firstName", "John"_S);
      obj_temp_1.set("lastName", "Doe"_S);
      obj_temp_1.set("age", js::number(30));
      return js::any(obj_temp_1);
    }());

auto sendEmail(EmailDomain email) {
    js::console.log(("Sending email to "_S + js::toString(email)));
}

auto fetchFromAPI(URLPath url) {
    js::console.log(("Fetching from "_S + js::toString(url)));
}

PersonEventHandlers createEventHandler() {
    return []() {
          js::object obj_temp_2;
          obj_temp_2.set("onNameChange", [](js::string value) -> auto { return js::console.log(("Name changed to "_S + js::toString(value))); });
          obj_temp_2.set("onAgeChange", [](js::number value) -> auto { return js::console.log(("Age changed to "_S + js::toString(value))); });
          obj_temp_2.set("onLocationChange", [](js::string value) -> auto { return js::console.log(("Location changed to "_S + js::toString(value))); });
          return js::any(obj_temp_2);
        }();
}

const js::any handlers = createEventHandler();

// Entry point
void Main() {
    person["on"]("firstNameChanged"_S, [](auto newName) -> auto {
js::console.log(("First name changed to "_S + js::toString(newName)));
});
    person["on"]("ageChanged"_S, [](auto newAge) -> auto {
js::console.log(("Age changed to "_S + js::toString(newAge)));
});
    sendEmail("user@example.com"_S);
    fetchFromAPI("https://api.com/users"_S);
    handlers["onNameChange"]("Alice"_S);
    handlers["onAgeChange"](js::number(25));
    handlers["onLocationChange"]("New York"_S);
    js::console.log("Template literal types test completed"_S);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}