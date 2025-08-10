#include "typeof-type-operator-test.h"

using namespace js;

const js::string stringValue = "hello"_S;

const js::number numberValue = js::number(42);

const bool booleanValue = true;

const js::any objectValue = []() {
      js::object obj_temp_0;
      obj_temp_0.set("x", js::number(10));
      obj_temp_0.set("y", js::number(20));
      return js::any(obj_temp_0);
    }();

js::array<js::number> arrayValue = js::array<js::number>{js::number(1), js::number(2), js::number(3)};

const js::any anotherString = "world"_S;

const js::any anotherNumber = js::number(100);

const js::any anotherObject = []() {
      js::object obj_temp_1;
      obj_temp_1.set("x", js::number(5));
      obj_temp_1.set("y", js::number(15));
      return js::any(obj_temp_1);
    }();

const js::any config = []() {
      js::object obj_temp_2;
      obj_temp_2.set("apiUrl", "https://api.example.com"_S);
      obj_temp_2.set("timeout", js::number(5000));
      obj_temp_2.set("retryAttempts", js::number(3));
      obj_temp_2.set("features", []() {
      js::object obj_temp_3;
      obj_temp_3.set("logging", true);
      obj_temp_3.set("caching", false);
      return js::any(obj_temp_3);
    }());
      return js::any(obj_temp_2);
    }();

js::string greet(js::string name) {
    return ("Hello, "_S + js::toString(name) + "!"_S);
}

const js::any multiply = [](js::number a, js::number b) -> js::number { return (a * b); };

const js::any myGreet = [](js::string n) -> auto { return ("Hi, "_S + js::toString(n) + "!"_S); };

const js::any myMultiply = [](js::number x, js::number y) -> auto { return (x * y); };

User::User(js::string name, js::number age) {
    {
    }
}

js::string User::greet() {
    {
            return ("Hello, I'm "_S + js::toString(this->name));
    }
}

const std::shared_ptr<User> userInstance = std::make_shared<User>("John"_S, js::number(30));

template<typename T, typename... Args>
T createInstance(js::any ctor, Args... args) {
    auto args_array = js::array<js::any>{args...};
    return std::make_shared<ctor>(/* spread args_array */);
}

const js::any newUser = createInstance(User, "Jane"_S, js::number(25));

js::array<js::number> numbers = js::array<js::number>{js::number(1), js::number(2), js::number(3), js::number(4), js::number(5)};

js::array<js::string> tuple = js::array<js::string>{"hello"_S, js::number(42), true};

// Enum Color implementation
const js::string Color::Red = "RED"_S;
const js::string Color::Green = "GREEN"_S;
const js::string Color::Blue = "BLUE"_S;


const js::any myColor = Color::Red;

const js::any anotherColor = Color::Blue;

template<typename T, typename K>
js::any _getProperty(T obj, K key) {
    return obj->key;
}

const js::any person = []() {
      js::object obj_temp_4;
      obj_temp_4.set("name", "Alice"_S);
      obj_temp_4.set("age", js::number(30));
      obj_temp_4.set("email", "alice@example.com"_S);
      return js::any(obj_temp_4);
    }();

void updatePerson(Partial updates) {
    js::Object::assign(person, updates);
}

const js::any Utils = []() {
      js::object obj_temp_6;
      obj_temp_6.set("version", "1.0.0"_S);
      obj_temp_6.set("log", [](js::string message) -> void {
js::console.log(message);
});
      return js::any(obj_temp_6);
    }();

const js::any symbolKey = Symbol("mySymbol"_S);

const js::any complexObject = []() {
      js::object obj_temp_7;
      obj_temp_7.set("data", js::array<js::number>{js::number(1), js::number(2), js::number(3)});
      obj_temp_7.set("process", [](js::number x) -> auto { return (x * js::number(2)); });
      obj_temp_7.set("metadata", []() {
      js::object obj_temp_8;
      obj_temp_8.set("created", js::Date());
      obj_temp_8.set("author", "Admin"_S);
      return js::any(obj_temp_8);
    }());
      return js::any(obj_temp_7);
    }();

js::array<js::number> processData(js::any obj) {
    return obj->data.map(obj->process);
}

const js::any result = processData(complexObject);

const js::any action1 = []() {
      js::object obj_temp_9;
      obj_temp_9.set("type", "ADD"_S);
      obj_temp_9.set("payload", js::number(10));
      return js::any(obj_temp_9);
    }();

const js::any action2 = []() {
      js::object obj_temp_10;
      obj_temp_10.set("type", "REMOVE"_S);
      obj_temp_10.set("payload", "item"_S);
      return js::any(obj_temp_10);
    }();

void handleAction(ActionType action) {
    switch (action["type"]) {
            case "ADD"_S:
                js::console.log("Adding:"_S, action["payload"]);
                break;
            case "REMOVE"_S:
                js::console.log("Removing:"_S, action["payload"]);
                break;
    }
}

auto getData() {
    return []() {
          js::object obj_temp_13;
          obj_temp_13.set("id", js::number(1));
          obj_temp_13.set("name", "Test"_S);
          obj_temp_13.set("values", js::array<js::number>{js::number(1), js::number(2), js::number(3)});
          return js::any(obj_temp_13);
        }();
}

const DataType myData = []() {
      js::object obj_temp_14;
      obj_temp_14.set("id", js::number(2));
      obj_temp_14.set("name", "My Data"_S);
      obj_temp_14.set("values", js::array<js::number>{js::number(4), js::number(5), js::number(6)});
      return js::any(obj_temp_14);
    }();

// Entry point
void Main() {
    js::console.log(myGreet("Alice"_S));
    js::console.log(myMultiply(js::number(3), js::number(4)));
    js::console.log(newUser->greet());
    js::console.log(anotherColor);
    updatePerson([]() {
      js::object obj_temp_5;
      obj_temp_5.set("age", js::number(31));
      return js::any(obj_temp_5);
    }());
    js::console.log(person["age"]);
    js::console.log("Processed:"_S, result);
    handleAction([]() {
      js::object obj_temp_11;
      obj_temp_11.set("type", "ADD"_S);
      obj_temp_11.set("payload", js::number(10));
      return js::any(obj_temp_11);
    }());
    handleAction([]() {
      js::object obj_temp_12;
      obj_temp_12.set("type", "REMOVE"_S);
      obj_temp_12.set("payload", "item"_S);
      return js::any(obj_temp_12);
    }());
    js::console.log(myData);
    js::console.log("Typeof type operator test completed"_S);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}