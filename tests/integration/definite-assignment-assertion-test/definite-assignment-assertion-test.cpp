#include "definite-assignment-assertion-test.h"

using namespace js;

BasicClass::BasicClass() {
    {
            this->value = "initialized"_S;
            this->count = js::number(42);
    }
}

auto BasicClass::updateValue(js::string newValue) {
    {
            this->value = newValue;
    }
}

js::string BasicClass::getValue() {
    {
            return this->value;
    }
}

auto ConfigManager::initialize(js::string url, js::number timeoutMs) {
    {
            this->apiUrl = url;
            this->timeout = timeoutMs;
            this->initialized = true;
            this->settings = []() {
                  js::object obj_temp_0;
                  obj_temp_0.set("theme", "dark"_S);
                  return js::any(obj_temp_0);
                }();
    }
}

bool ConfigManager::isReady() {
    {
            return this->initialized;
    }
}

js::string BaseService::getInfo() {
    {
            return (js::toString(this->serviceName) + " v"_S + js::toString(this->version));
    }
}

void UserService::init() {
    {
            this->serviceName = "UserService"_S;
            this->version = js::number(1);
            this->userCount = js::number(0);
    }
}

void UserService::addUser() {
    {
            this->userCount++;
    }
}

void Container::initialize(T item, js::number cap) {
    {
            this->data = item;
            this->size = js::number(1);
            this->capacity = cap;
    }
}

T Container::getData() {
    {
            return this->data;
    }
}

void StaticExample::setup() {
    {
            StaticExample::globalConfig = []() {
                  js::object obj_temp_1;
                  obj_temp_1.set("mode", "production"_S);
                  return js::any(obj_temp_1);
                }();
            StaticExample::initialized = true;
    }
}

StaticExample::StaticExample(js::string data) {
    {
            this->instanceData = data;
    }
}

void MixedProperties::setup() {
    {
            this->definiteString = "assigned"_S;
            this->definiteNumber = js::number(123);
            this->definiteBoolean = true;
            this->definiteObject = []() {
                  js::object obj_temp_2;
                  obj_temp_2.set("id", js::number(1));
                  obj_temp_2.set("name", "test"_S);
                  return js::any(obj_temp_2);
                }();
            this->definiteArray = js::array<js::string>{"a"_S, "b"_S, "c"_S};
    }
}

ReadonlyExample::ReadonlyExample(js::number id, js::string name) {
    {
            this->id = id;
            this->name = name;
            this->created = js::Date();
    }
}

void main() {
    js::console.log("Definite assignment assertion test started"_S);
    const std::shared_ptr<BasicClass> basic = std::make_shared<BasicClass>();
    js::console.log("Basic value:"_S, basic["getValue"]());
    basic["updateValue"]("updated"_S);
    js::console.log("Updated value:"_S, basic["getValue"]());
    const std::shared_ptr<ConfigManager> config = std::make_shared<ConfigManager>();
    config["initialize"]("https://api.example.com"_S, js::number(5000));
    js::console.log("Config ready:"_S, config["isReady"]());
    js::console.log("API URL:"_S, config["apiUrl"]);
    const std::shared_ptr<UserService> userService = std::make_shared<UserService>();
    userService->init();
    js::console.log("Service info:"_S, userService->getInfo());
    userService->addUser();
    const std::shared_ptr<Container> stringContainer = std::make_shared<Container>();
    stringContainer->initialize("hello"_S, js::number(10));
    js::console.log("Container data:"_S, stringContainer->getData());
    StaticExample::setup();
    const std::shared_ptr<StaticExample> staticExample = std::make_shared<StaticExample>("instance"_S);
    js::console.log("Static initialized:"_S, StaticExample::initialized);
    const std::shared_ptr<MixedProperties> mixed = std::make_shared<MixedProperties>();
    mixed["setup"]();
    js::console.log("Mixed string:"_S, mixed["definiteString"]);
    js::console.log("Regular string:"_S, mixed["regularString"]);
    const std::shared_ptr<ReadonlyExample> readonly = std::make_shared<ReadonlyExample>(js::number(42), "readonly test"_S);
    js::console.log("Readonly ID:"_S, readonly["id"]);
    js::console.log("Definite assignment assertion test completed"_S);
}
