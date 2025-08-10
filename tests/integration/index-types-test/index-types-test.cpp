#include "index-types-test.h"

using namespace js;

template<typename T, typename K>
js::any getProperty(T obj, K key) {
    return obj->key;
}

const Person person = []() {
      js::object obj_temp_0;
      obj_temp_0.set("name", "John"_S);
      obj_temp_0.set("age", js::number(30));
      obj_temp_0.set("email", "john@example.com"_S);
      return js::any(obj_temp_0);
    }();

const js::any name = getProperty(person, "name"_S);

const js::any age = getProperty(person, "age"_S);

const StringDictionary dict = []() {
      js::object obj_temp_1;
      obj_temp_1.set("hello", "world"_S);
      obj_temp_1.set("foo", "bar"_S);
      obj_temp_1.set("baz", "qux"_S);
      return js::any(obj_temp_1);
    }();

const NumberDictionary arr = []() {
      js::object obj_temp_2;
      obj_temp_2.set("0", "first"_S);
      obj_temp_2.set("1", "second"_S);
      obj_temp_2.set("2", "third"_S);
      return js::any(obj_temp_2);
    }();

const MixedDictionary mixed = []() {
      js::object obj_temp_3;
      obj_temp_3.set("length", js::number(10));
      obj_temp_3.set("name", "MyDictionary"_S);
      obj_temp_3.set("key1", "value1"_S);
      obj_temp_3.set("key2", js::number(42));
      return js::any(obj_temp_3);
    }();

template<typename T, typename K>
Pick pickProperties(T obj, js::array<K> keys) {
    const js::any result = []() {
          js::object obj_temp_4;
          return js::any(obj_temp_4);
        }();
    for (const auto& key : keys) {
            {
                        result->key = obj->key;
            }
    }
    return result;
}

const js::any nameAndAge = pickProperties(person, js::array<js::string>{"name"_S, "age"_S});

template<typename T, typename K>
js::array<js::any> pluck(js::array<T> objects, K key) {
    return objects.map([](auto obj) -> auto { return obj->key; });
}

js::array<Person> people = js::array<js::any>{[]() {
      js::object obj_temp_5;
      obj_temp_5.set("name", "Alice"_S);
      obj_temp_5.set("age", js::number(25));
      obj_temp_5.set("email", "alice@example.com"_S);
      return js::any(obj_temp_5);
    }(), []() {
      js::object obj_temp_6;
      obj_temp_6.set("name", "Bob"_S);
      obj_temp_6.set("age", js::number(30));
      obj_temp_6.set("email", "bob@example.com"_S);
      return js::any(obj_temp_6);
    }(), []() {
      js::object obj_temp_7;
      obj_temp_7.set("name", "Charlie"_S);
      obj_temp_7.set("age", js::number(35));
      obj_temp_7.set("email", "charlie@example.com"_S);
      return js::any(obj_temp_7);
    }()};

const js::any names = pluck(people, "name"_S);

const js::any ages = pluck(people, "age"_S);

// Entry point
void Main() {
    dict["newKey"_S] = "newValue"_S;
    js::console.log(dict["hello"_S]);
    js::console.log(arr[js::number(0)]);
    js::console.log(arr[js::number(1)]);
    js::console.log(mixed.length());
    js::console.log(mixed["key1"_S]);
    js::console.log(nameAndAge->name);
    js::console.log(nameAndAge->age);
    js::console.log("Names:"_S, names);
    js::console.log("Ages:"_S, ages);
    js::console.log("Index types test completed"_S);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}