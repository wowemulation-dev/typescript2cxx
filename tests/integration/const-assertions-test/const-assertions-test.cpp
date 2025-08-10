#include "const-assertions-test.h"

using namespace js;

const js::string literalString = "hello"_S;

const js::number _literalNumber = js::number(42);

const bool _literalBoolean = true;

const js::any config = []() {
      js::object obj_temp_0;
      obj_temp_0.set("apiUrl", "https://api.example.com"_S);
      obj_temp_0.set("timeout", js::number(5000));
      obj_temp_0.set("retryAttempts", js::number(3));
      obj_temp_0.set("features", []() {
      js::object obj_temp_1;
      obj_temp_1.set("logging", true);
      obj_temp_1.set("caching", false);
      return js::any(obj_temp_1);
    }());
      return js::any(obj_temp_0);
    }();

const js::array<js::string> colors = js::array<js::string>{"red"_S, "green"_S, "blue"_S};

const js::array<js::number> _numbers = js::array<js::number>{js::number(1), js::number(2), js::number(3), js::number(4), js::number(5)};

const js::array<js::string> _mixed = js::array<js::string>{"hello"_S, js::number(42), true, []() {
      js::object obj_temp_2;
      obj_temp_2.set("x", js::number(10));
      return js::any(obj_temp_2);
    }()};

const js::array<js::number> _tuple = js::array<js::number>{js::number(10), "hello"_S};

const js::any _nested = []() {
      js::object obj_temp_3;
      obj_temp_3.set("data", js::array<js::number>{js::number(1), js::number(2), js::number(3)});
      obj_temp_3.set("settings", []() {
      js::object obj_temp_4;
      obj_temp_4.set("mode", "dark"_S);
      obj_temp_4.set("level", js::number(5));
      return js::any(obj_temp_4);
    }());
      return js::any(obj_temp_3);
    }();

auto getConfig() {
    return []() {
          js::object obj_temp_5;
          obj_temp_5.set("host", "localhost"_S);
          obj_temp_5.set("port", js::number(8080));
          obj_temp_5.set("ssl", false);
          return js::any(obj_temp_5);
        }();
}

const js::any serverConfig = getConfig();

const js::string prefix = "api"_S;

const js::string version = "v1"_S;

const js::any endpoint = ("/"_S + js::toString(prefix) + "/"_S + js::toString(version) + "/users"_S);

auto processColors(js::any colors) {
    return colors.map([](auto c) -> auto { return c.toUpperCase(); });
}

const js::any _result = processColors(js::array<js::string>{"red"_S, "green"_S, "blue"_S});

const js::any action1 = []() {
      js::object obj_temp_6;
      obj_temp_6.set("type", "ADD"_S);
      obj_temp_6.set("payload", js::number(10));
      return js::any(obj_temp_6);
    }();

const js::any action2 = []() {
      js::object obj_temp_7;
      obj_temp_7.set("type", "REMOVE"_S);
      obj_temp_7.set("payload", "item"_S);
      return js::any(obj_temp_7);
    }();

const js::any action3 = []() {
      js::object obj_temp_8;
      obj_temp_8.set("type", "UPDATE"_S);
      obj_temp_8.set("payload", []() {
      js::object obj_temp_9;
      obj_temp_9.set("id", js::number(1));
      obj_temp_9.set("value", "new"_S);
      return js::any(obj_temp_9);
    }());
      return js::any(obj_temp_8);
    }();

auto handleAction(Action action) {
    switch (action["type"]) {
            case "ADD"_S:
                js::console.log("Adding:"_S, action["payload"]);
                break;
            case "REMOVE"_S:
                js::console.log("Removing:"_S, action["payload"]);
                break;
            case "UPDATE"_S:
                js::console.log("Updating:"_S, action["payload"]["id"], action["payload"]["value"]);
                break;
    }
}

const js::any Direction = []() {
      js::object obj_temp_10;
      obj_temp_10.set("Up", js::number(0));
      obj_temp_10.set("Down", js::number(1));
      obj_temp_10.set("Left", js::number(2));
      obj_temp_10.set("Right", js::number(3));
      return js::any(obj_temp_10);
    }();

const js::any DATABASE_CONFIG = []() {
      js::object obj_temp_11;
      obj_temp_11.set("host", "localhost"_S);
      obj_temp_11.set("port", js::number(5432));
      obj_temp_11.set("database", "myapp"_S);
      obj_temp_11.set("credentials", []() {
      js::object obj_temp_12;
      obj_temp_12.set("username", "admin"_S);
      obj_temp_12.set("password", "secret"_S);
      return js::any(obj_temp_12);
    }());
      return js::any(obj_temp_11);
    }();

auto connectToDatabase(DatabaseConfig config) {
    js::console.log(("Connecting to "_S + js::toString(config["host"]) + ":"_S + js::toString(config["port"]) + "/"_S + js::toString(config["database"])));
}

const js::any routes = []() {
      js::object obj_temp_13;
      obj_temp_13.set("home", "/"_S);
      obj_temp_13.set("about", "/about"_S);
      obj_temp_13.set("contact", "/contact"_S);
      obj_temp_13.set("api", []() {
      js::object obj_temp_14;
      obj_temp_14.set("users", "/api/users"_S);
      obj_temp_14.set("posts", "/api/posts"_S);
      return js::any(obj_temp_14);
    }());
      return js::any(obj_temp_13);
    }();

auto navigateTo(js::any route) {
    js::console.log("Navigating to:"_S, route);
}

// Entry point
void Main() {
    connectToDatabase(DATABASE_CONFIG);
    navigateTo(routes["home"]);
    navigateTo(routes["api"]["users"]);
    js::console.log("Literal string:"_S, literalString);
    js::console.log("Config API URL:"_S, config["apiUrl"]);
    js::console.log("Colors:"_S, colors);
    js::console.log("Server config port:"_S, serverConfig->port);
    js::console.log("Endpoint:"_S, endpoint);
    handleAction([]() {
      js::object obj_temp_15;
      obj_temp_15.set("type", "ADD"_S);
      obj_temp_15.set("payload", js::number(10));
      return js::any(obj_temp_15);
    }());
    handleAction([]() {
      js::object obj_temp_16;
      obj_temp_16.set("type", "REMOVE"_S);
      obj_temp_16.set("payload", "item"_S);
      return js::any(obj_temp_16);
    }());
    js::console.log("Const assertions test completed"_S);
}

int main(int /*argc*/, char** /*argv*/) {
    Main();
    return 0;
}