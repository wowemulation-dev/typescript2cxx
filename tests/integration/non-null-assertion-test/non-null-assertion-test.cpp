#include "non-null-assertion-test.h"

using namespace js;

js::number testBasicNonNull(js::typed::Nullable<js::string> value) {
    return value.length();
}

js::string testObjectNonNull(js::typed::Nullable<User> user) {
    return user->name;
}

js::string testOptionalNonNull(User user) {
    return user->email;
}

js::string testChainedNonNull(js::typed::Nullable<DataStructure> data) {
    return data->user.name;
}

js::string testNestedNonNull(js::typed::Nullable<DataStructure> data) {
    return data->config.settings.theme;
}

js::string testArrayNonNull(js::array<js::typed::Nullable<js::string>> items) {
    return items[js::number(0)];
}

js::typed::Nullable<User> maybeGetUser() {
    return []() {
          js::object obj_temp_0;
          obj_temp_0.set("name", "Alice"_S);
          obj_temp_0.set("email", "alice@example.com"_S);
          return js::any(obj_temp_0);
        }();
}

js::string testFunctionNonNull() {
    return maybeGetUser()->name;
}

js::string Container::getValue() {
    {
            return this->data.value;
    }
}

js::string testComplexExpression(js::typed::Nullable<js::array<User>> users) {
    return users[js::number(0)].email;
}

js::number _testMethodNonNull(js::typed::Nullable<Service> service) {
    return service->getData().length();
}

void main() {
    js::console.log("Non-null assertion test started"_S);
    const js::any _result1 = testBasicNonNull("hello"_S);
    const User _user = []() {
          js::object obj_temp_1;
          obj_temp_1.set("name", "John"_S);
          obj_temp_1.set("email", "john@example.com"_S);
          return js::any(obj_temp_1);
        }();
    const js::any _result2 = testObjectNonNull(_user);
    const js::any _result3 = testOptionalNonNull(_user);
    const DataStructure _data = []() {
          js::object obj_temp_2;
          obj_temp_2.set("user", []() {
          js::object obj_temp_3;
          obj_temp_3.set("name", "Alice"_S);
          return js::any(obj_temp_3);
        }());
          obj_temp_2.set("config", []() {
          js::object obj_temp_4;
          obj_temp_4.set("settings", []() {
          js::object obj_temp_5;
          obj_temp_5.set("theme", "dark"_S);
          return js::any(obj_temp_5);
        }());
          return js::any(obj_temp_4);
        }());
          return js::any(obj_temp_2);
        }();
    const js::any _result4 = testChainedNonNull(_data);
    const js::any _result5 = testNestedNonNull(_data);
    js::array<js::string> _items = js::array<js::string>{"first"_S, "second"_S};
    const js::any _result6 = testArrayNonNull(_items);
    const js::any _result7 = testFunctionNonNull();
    const std::shared_ptr<Container> _container = std::make_shared<Container>();
    _container::data = []() {
          js::object obj_temp_6;
          obj_temp_6.set("value", "test"_S);
          return js::any(obj_temp_6);
        }();
    const js::any _result8 = _container::getValue();
    js::array<js::any> _users = js::array<js::any>{[]() {
          js::object obj_temp_7;
          obj_temp_7.set("name", "Bob"_S);
          obj_temp_7.set("email", "bob@example.com"_S);
          return js::any(obj_temp_7);
        }()};
    const js::any _result9 = testComplexExpression(_users);
    js::console.log("Non-null assertion test completed"_S);
}
