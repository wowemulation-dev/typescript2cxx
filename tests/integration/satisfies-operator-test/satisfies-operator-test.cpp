#include "satisfies-operator-test.h"

using namespace js;

const js::any colors = []() {
      js::object obj_temp_0;
      obj_temp_0.set("red", "#ff0000"_S);
      obj_temp_0.set("green", "#00ff00"_S);
      obj_temp_0.set("blue", "#0000ff"_S);
      return js::any(obj_temp_0);
    }();

const js::string _redColor = colors["red"];

const js::any config = []() {
      js::object obj_temp_1;
      obj_temp_1.set("host", "localhost"_S);
      obj_temp_1.set("port", js::number(8080));
      obj_temp_1.set("ssl", false);
      return js::any(obj_temp_1);
    }();

const js::any _port = config["port"];

const js::any routes = []() {
      js::object obj_temp_2;
      obj_temp_2.set("home", "/"_S);
      obj_temp_2.set("about", "/about"_S);
      obj_temp_2.set("contact", "/contact"_S);
      return js::any(obj_temp_2);
    }();

auto getConfig() {
    return []() {
          js::object obj_temp_3;
          obj_temp_3.set("apiUrl", "https://api.example.com"_S);
          obj_temp_3.set("timeout", js::number(5000));
          obj_temp_3.set("retryAttempts", js::number(3));
          return js::any(obj_temp_3);
        }();
}

const js::any apiConfig = getConfig();

const js::string currentStatus = "success"_S;

js::array<js::number> _numbers = js::array<js::number>{js::number(1), js::number(2), js::number(3), js::number(4), js::number(5)};

js::array<js::number> _mixedArray = js::array<js::number>{js::number(1), "two"_S, true, []() {
      js::object obj_temp_4;
      obj_temp_4.set("x", js::number(10));
      return js::any(obj_temp_4);
    }()};

const js::any user = []() {
      js::object obj_temp_5;
      obj_temp_5.set("id", js::number(1));
      obj_temp_5.set("name", "John Doe"_S);
      obj_temp_5.set("settings", []() {
      js::object obj_temp_6;
      obj_temp_6.set("theme", "dark"_S);
      obj_temp_6.set("notifications", true);
      return js::any(obj_temp_6);
    }());
      return js::any(obj_temp_5);
    }();

const js::any profile = []() {
      js::object obj_temp_7;
      obj_temp_7.set("username", "johndoe"_S);
      obj_temp_7.set("email", "john@example.com"_S);
      return js::any(obj_temp_7);
    }();

const js::any _stringContainer = []() {
      js::object obj_temp_8;
      obj_temp_8.set("value", "hello"_S);
      obj_temp_8.set("setValue", [](js::string val) -> auto {
js::console.log("Setting value:"_S, val);
});
      return js::any(obj_temp_8);
    }();

const js::any preferences = []() {
      js::object obj_temp_9;
      obj_temp_9.set("theme", "dark"_S);
      obj_temp_9.set("language", "en"_S);
      obj_temp_9.set("fontSize", js::number(14));
      return js::any(obj_temp_9);
    }();

// Entry point
void Main() {
    js::console.log("Colors red:"_S, colors["red"]);
    js::console.log("Config port:"_S, config["port"]);
    js::console.log("Routes home:"_S, routes["home"]);
    js::console.log("API config:"_S, apiConfig->apiUrl);
    js::console.log("Current status:"_S, currentStatus);
    js::console.log("User name:"_S, user->name);
    js::console.log("Profile username:"_S, profile["username"]);
    js::console.log("Preferences theme:"_S, preferences["theme"]);
    js::console.log("Satisfies operator test completed"_S);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}