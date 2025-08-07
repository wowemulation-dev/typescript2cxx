#include "core.h"
#include <sstream>
#include <iomanip>
#include <cctype>
#include <climits>
#include <iterator>

namespace js {

// Number static constants
const number number::NaN = std::numeric_limits<double>::quiet_NaN();
const number number::POSITIVE_INFINITY = std::numeric_limits<double>::infinity();
const number number::NEGATIVE_INFINITY = -std::numeric_limits<double>::infinity();
const number number::MAX_VALUE = std::numeric_limits<double>::max();
const number number::MIN_VALUE = std::numeric_limits<double>::min();
const number number::EPSILON = std::numeric_limits<double>::epsilon();
const number number::MAX_SAFE_INTEGER = 9007199254740991.0; // 2^53 - 1
const number number::MIN_SAFE_INTEGER = -9007199254740991.0; // -(2^53 - 1)

// Number implementation
number::number(const std::string& str) {
    try {
        value_ = std::stod(str);
    } catch (...) {
        value_ = std::numeric_limits<double>::quiet_NaN();
    }
}

string number::toString(int radix) const {
    if (radix < 2 || radix > 36) {
        throw RangeError("toString() radix argument must be between 2 and 36");
    }
    
    if (std::isnan(value_)) return "NaN";
    if (std::isinf(value_)) return value_ > 0 ? "Infinity" : "-Infinity";
    
    if (radix == 10) {
        return string(std::to_string(value_));
    }
    
    // Simple radix conversion for integers
    long long intVal = static_cast<long long>(value_);
    if (intVal != value_) {
        return string(std::to_string(value_)); // Fallback to decimal for non-integers
    }
    
    if (intVal == 0) return "0";
    
    const char digits[] = "0123456789abcdefghijklmnopqrstuvwxyz";
    std::string result;
    bool negative = intVal < 0;
    if (negative) intVal = -intVal;
    
    while (intVal > 0) {
        result = digits[intVal % radix] + result;
        intVal /= radix;
    }
    
    return string((negative ? "-" : "") + result);
}

string number::toFixed(int digits) const {
    if (digits < 0 || digits > 100) {
        throw RangeError("toFixed() digits argument must be between 0 and 100");
    }
    
    if (std::isnan(value_)) return "NaN";
    if (std::isinf(value_)) return value_ > 0 ? "Infinity" : "-Infinity";
    
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(digits) << value_;
    return string(oss.str());
}

string number::toExponential(int fractionDigits) const {
    if (std::isnan(value_)) return "NaN";
    if (std::isinf(value_)) return value_ > 0 ? "Infinity" : "-Infinity";
    
    std::ostringstream oss;
    if (fractionDigits >= 0) {
        oss << std::scientific << std::setprecision(fractionDigits) << value_;
    } else {
        oss << std::scientific << value_;
    }
    return string(oss.str());
}

string number::toPrecision(int precision) const {
    if (std::isnan(value_)) return "NaN";
    if (std::isinf(value_)) return value_ > 0 ? "Infinity" : "-Infinity";
    
    if (precision < 1 || precision > 100) {
        throw RangeError("toPrecision() precision argument must be between 1 and 100");
    }
    
    std::ostringstream oss;
    oss << std::setprecision(precision) << value_;
    return string(oss.str());
}

number number::parseInt(const string& str, int radix) {
    return js::parseInt(str, radix);
}

number number::parseFloat(const string& str) {
    return js::parseFloat(str);
}

bool number::isInteger(const number& num) {
    return std::isfinite(num.value_) && std::floor(num.value_) == num.value_;
}

bool number::isSafeInteger(const number& num) {
    return isInteger(num) && std::abs(num.value_) <= MAX_SAFE_INTEGER.value_;
}

// String implementation
string string::operator[](size_t index) const {
    if (index >= value_.length()) return "";
    return string(std::string(1, value_[index]));
}

string string::charAt(size_t index) const {
    return (*this)[index];
}

number string::charCodeAt(size_t index) const {
    if (index >= value_.length()) return number::NaN;
    return number(static_cast<double>(static_cast<unsigned char>(value_[index])));
}

number string::codePointAt(size_t index) const {
    if (index >= value_.length()) return number::NaN;
    // Simplified - doesn't handle Unicode surrogate pairs
    return charCodeAt(index);
}

string string::slice(int start, int end) const {
    int len = static_cast<int>(value_.length());
    
    // Handle negative indices
    if (start < 0) start = std::max(0, len + start);
    if (end < 0) end = std::max(0, len + end);
    if (end == -1) end = len;
    
    // Clamp to bounds
    start = std::min(start, len);
    end = std::min(end, len);
    
    if (start >= end) return "";
    
    return string(value_.substr(start, end - start));
}

string string::substring(int start, int end) const {
    int len = static_cast<int>(value_.length());
    
    // substring doesn't handle negative indices the same way as slice
    start = std::max(0, start);
    if (end == -1) end = len;
    else end = std::max(0, end);
    
    // substring swaps start and end if start > end
    if (start > end) std::swap(start, end);
    
    start = std::min(start, len);
    end = std::min(end, len);
    
    return string(value_.substr(start, end - start));
}

string string::substr(int start, int length) const {
    int len = static_cast<int>(value_.length());
    
    if (start < 0) start = std::max(0, len + start);
    if (length == -1) length = len - start;
    
    start = std::min(start, len);
    length = std::max(0, std::min(length, len - start));
    
    return string(value_.substr(start, length));
}

string string::toLowerCase() const {
    std::string result = value_;
    std::transform(result.begin(), result.end(), result.begin(), ::tolower);
    return string(result);
}

string string::toUpperCase() const {
    std::string result = value_;
    std::transform(result.begin(), result.end(), result.begin(), ::toupper);
    return string(result);
}

string string::toLocaleLowerCase() const {
    return toLowerCase(); // Simplified - doesn't handle locale-specific rules
}

string string::toLocaleUpperCase() const {
    return toUpperCase(); // Simplified - doesn't handle locale-specific rules
}

string string::trim() const {
    const std::string whitespace = " \t\n\r\f\v";
    size_t start = value_.find_first_not_of(whitespace);
    if (start == std::string::npos) return "";
    
    size_t end = value_.find_last_not_of(whitespace);
    return string(value_.substr(start, end - start + 1));
}

string string::trimStart() const {
    const std::string whitespace = " \t\n\r\f\v";
    size_t start = value_.find_first_not_of(whitespace);
    if (start == std::string::npos) return "";
    return string(value_.substr(start));
}

string string::trimEnd() const {
    const std::string whitespace = " \t\n\r\f\v";
    size_t end = value_.find_last_not_of(whitespace);
    if (end == std::string::npos) return "";
    return string(value_.substr(0, end + 1));
}

int string::indexOf(const string& searchString, size_t fromIndex) const {
    size_t pos = value_.find(searchString.value_, fromIndex);
    return (pos != std::string::npos) ? static_cast<int>(pos) : -1;
}

int string::lastIndexOf(const string& searchString, size_t fromIndex) const {
    size_t pos = value_.rfind(searchString.value_, fromIndex);
    return (pos != std::string::npos) ? static_cast<int>(pos) : -1;
}

bool string::includes(const string& searchString, size_t fromIndex) const {
    return indexOf(searchString, fromIndex) != -1;
}

bool string::startsWith(const string& searchString, size_t position) const {
    if (position >= value_.length()) return false;
    return value_.substr(position, searchString.value_.length()) == searchString.value_;
}

bool string::endsWith(const string& searchString, size_t length) const {
    size_t len = (length == std::string::npos) ? value_.length() : std::min(length, value_.length());
    if (len < searchString.value_.length()) return false;
    return value_.substr(len - searchString.value_.length(), searchString.value_.length()) == searchString.value_;
}

int string::search(const std::regex& regexp) const {
    std::smatch match;
    if (std::regex_search(value_, match, regexp)) {
        return static_cast<int>(match.position());
    }
    return -1;
}

array<string> string::split(const string& separator, int limit) const {
    array<string> result;
    
    if (limit == 0) return result;
    if (separator.empty()) {
        // Split into individual characters
        for (size_t i = 0; i < value_.length() && (limit < 0 || static_cast<int>(result.size()) < limit); ++i) {
            result.push(string(std::string(1, value_[i])));
        }
        return result;
    }
    
    size_t start = 0;
    size_t pos = value_.find(separator.value_);
    
    while (pos != std::string::npos && (limit < 0 || static_cast<int>(result.size()) < limit - 1)) {
        result.push(string(value_.substr(start, pos - start)));
        start = pos + separator.value_.length();
        pos = value_.find(separator.value_, start);
    }
    
    if (limit < 0 || static_cast<int>(result.size()) < limit) {
        result.push(string(value_.substr(start)));
    }
    
    return result;
}

array<string> string::split(const std::regex& separator, int limit) const {
    array<string> result;
    
    if (limit == 0) return result;
    
    std::sregex_token_iterator iter(value_.begin(), value_.end(), separator, -1);
    std::sregex_token_iterator end;
    
    for (; iter != end && (limit < 0 || static_cast<int>(result.size()) < limit); ++iter) {
        result.push(string(iter->str()));
    }
    
    return result;
}

string string::replace(const string& searchValue, const string& replaceValue) const {
    std::string result = value_;
    size_t pos = result.find(searchValue.value_);
    if (pos != std::string::npos) {
        result.replace(pos, searchValue.value_.length(), replaceValue.value_);
    }
    return string(result);
}

string string::replace(const std::regex& searchValue, const string& replaceValue) const {
    return string(std::regex_replace(value_, searchValue, replaceValue.value_));
}

string string::replaceAll(const string& searchValue, const string& replaceValue) const {
    std::string result = value_;
    size_t pos = 0;
    
    while ((pos = result.find(searchValue.value_, pos)) != std::string::npos) {
        result.replace(pos, searchValue.value_.length(), replaceValue.value_);
        pos += replaceValue.value_.length();
    }
    
    return string(result);
}

std::optional<array<string>> string::match(const std::regex& regexp) const {
    std::smatch matches;
    if (std::regex_search(value_, matches, regexp)) {
        array<string> result;
        for (const auto& match : matches) {
            result.push(string(match.str()));
        }
        return result;
    }
    return std::nullopt;
}

array<string> string::matchAll(const std::regex& regexp) const {
    array<string> result;
    std::sregex_iterator iter(value_.begin(), value_.end(), regexp);
    std::sregex_iterator end;
    
    for (; iter != end; ++iter) {
        const std::smatch& match = *iter;
        result.push(string(match.str()));
    }
    
    return result;
}

string string::padStart(size_t targetLength, const string& padString) const {
    if (value_.length() >= targetLength) return *this;
    
    size_t padLength = targetLength - value_.length();
    string pad = padString.empty() ? " " : padString;
    
    std::string result;
    while (result.length() < padLength) {
        result += pad.value_;
    }
    
    if (result.length() > padLength) {
        result = result.substr(0, padLength);
    }
    
    return string(result + value_);
}

string string::padEnd(size_t targetLength, const string& padString) const {
    if (value_.length() >= targetLength) return *this;
    
    size_t padLength = targetLength - value_.length();
    string pad = padString.empty() ? " " : padString;
    
    std::string result = value_;
    while (result.length() < targetLength) {
        size_t remaining = targetLength - result.length();
        if (pad.value_.length() <= remaining) {
            result += pad.value_;
        } else {
            result += pad.value_.substr(0, remaining);
        }
    }
    
    return string(result);
}

string string::repeat(size_t count) const {
    std::string result;
    for (size_t i = 0; i < count; ++i) {
        result += value_;
    }
    return string(result);
}

string string::fromCharCode(const std::vector<number>& codes) {
    std::string result;
    for (const auto& code : codes) {
        result += static_cast<char>(static_cast<int>(code) & 0xFFFF);
    }
    return string(result);
}

string string::fromCodePoint(const std::vector<number>& codePoints) {
    // Simplified - doesn't handle full Unicode
    return fromCharCode(codePoints);
}

string string::raw(const std::vector<string>& template_strings, const std::vector<any>& substitutions) {
    std::string result;
    
    for (size_t i = 0; i < template_strings.size(); ++i) {
        result += template_strings[i].value_;
        if (i < substitutions.size()) {
            result += toString(substitutions[i]).value_;
        }
    }
    
    return string(result);
}

// Object implementation
object::object(const std::initializer_list<std::pair<string, any>>& init) {
    for (const auto& pair : init) {
        properties_[pair.first] = pair.second;
    }
}

const any& object::operator[](const string& key) const {
    static any defaultValue = undefined;
    auto it = properties_.find(key);
    if (it != properties_.end()) {
        return it->second;
    }
    
    // Search prototype chain
    if (prototype_) {
        return (*prototype_)[key];
    }
    
    return defaultValue;
}

bool object::hasOwnProperty(const string& key) const {
    return properties_.find(key) != properties_.end();
}

bool object::hasProperty(const string& key) const {
    if (hasOwnProperty(key)) return true;
    
    if (prototype_) {
        return prototype_->hasProperty(key);
    }
    
    return false;
}

void object::defineProperty(const string& key, const any& value) {
    properties_[key] = value;
}

void object::deleteProperty(const string& key) {
    properties_.erase(key);
}

array<string> object::getOwnPropertyNames() const {
    array<string> result;
    for (const auto& pair : properties_) {
        result.push(pair.first);
    }
    return result;
}

array<string> object::keys() const {
    return getOwnPropertyNames();
}

array<any> object::values() const {
    array<any> result;
    for (const auto& pair : properties_) {
        result.push(pair.second);
    }
    return result;
}

array<std::pair<string, any>> object::entries() const {
    array<std::pair<string, any>> result;
    for (const auto& pair : properties_) {
        result.push(pair);
    }
    return result;
}

array<string> object::keys(const object& obj) {
    return obj.keys();
}

array<any> object::values(const object& obj) {
    return obj.values();
}

array<std::pair<string, any>> object::entries(const object& obj) {
    return obj.entries();
}

object object::assign(object& target, const std::vector<object>& sources) {
    for (const auto& source : sources) {
        for (const auto& pair : source.properties_) {
            target.properties_[pair.first] = pair.second;
        }
    }
    return target;
}

std::shared_ptr<object> object::create(std::shared_ptr<object> proto) {
    auto obj = std::make_shared<object>();
    obj->setPrototype(proto);
    return obj;
}

// Math implementation
double Math::max(const std::vector<double>& values) {
    if (values.empty()) return -INFINITY;
    return *std::max_element(values.begin(), values.end());
}

double Math::min(const std::vector<double>& values) {
    if (values.empty()) return INFINITY;
    return *std::min_element(values.begin(), values.end());
}

double Math::hypot(const std::vector<double>& values) {
    double sum = 0.0;
    for (double val : values) {
        sum += val * val;
    }
    return std::sqrt(sum);
}

int32_t Math::imul(int32_t a, int32_t b) {
    return static_cast<int32_t>(static_cast<uint32_t>(a) * static_cast<uint32_t>(b));
}

int32_t Math::clz32(uint32_t x) {
    if (x == 0) return 32;
    return __builtin_clz(x);
}

// Date implementation
Date::Date() : time_point_(std::chrono::system_clock::now()) {}

Date::Date(double milliseconds) {
    time_point_ = std::chrono::system_clock::from_time_t(0) + 
                  std::chrono::milliseconds(static_cast<long long>(milliseconds));
}

Date::Date(const string& dateString) {
    // Simplified parsing - would need more robust implementation
    time_point_ = std::chrono::system_clock::now();
}

Date::Date(int year, int month, int day, int hours, int minutes, int seconds, int ms) {
    std::tm tm = {};
    tm.tm_year = year - 1900;
    tm.tm_mon = month;
    tm.tm_mday = day;
    tm.tm_hour = hours;
    tm.tm_min = minutes;
    tm.tm_sec = seconds;
    
    time_point_ = std::chrono::system_clock::from_time_t(std::mktime(&tm)) +
                  std::chrono::milliseconds(ms);
}

double Date::now() {
    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch());
    return static_cast<double>(ms.count());
}

double Date::parse(const string& dateString) {
    // Simplified parsing
    return now();
}

double Date::UTC(int year, int month, int day, int hours, int minutes, int seconds, int ms) {
    Date date(year, month, day, hours, minutes, seconds, ms);
    return date.getTime();
}

int Date::getFullYear() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_year + 1900;
}

int Date::getMonth() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_mon;
}

int Date::getDate() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_mday;
}

int Date::getHours() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_hour;
}

int Date::getMinutes() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_min;
}

int Date::getSeconds() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_sec;
}

int Date::getMilliseconds() const {
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(time_point_.time_since_epoch());
    return ms.count() % 1000;
}

int Date::getDay() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* tm = std::localtime(&time);
    return tm->tm_wday;
}

double Date::getTime() const {
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(time_point_.time_since_epoch());
    return static_cast<double>(ms.count());
}

int Date::getTimezoneOffset() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* local_tm = std::localtime(&time);
    std::tm* utc_tm = std::gmtime(&time);
    
    // Calculate offset in minutes
    int local_hour = local_tm->tm_hour;
    int utc_hour = utc_tm->tm_hour;
    
    return (utc_hour - local_hour) * 60; // Simplified calculation
}

string Date::toString() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    return string(std::ctime(&time));
}

string Date::toDateString() const {
    // Simplified implementation
    return toString();
}

string Date::toTimeString() const {
    // Simplified implementation
    return toString();
}

string Date::toISOString() const {
    time_t time = std::chrono::system_clock::to_time_t(time_point_);
    std::tm* utc_tm = std::gmtime(&time);
    
    std::ostringstream oss;
    oss << std::put_time(utc_tm, "%Y-%m-%dT%H:%M:%S");
    oss << "." << std::setfill('0') << std::setw(3) << getMilliseconds() << "Z";
    
    return string(oss.str());
}

string Date::toUTCString() const {
    return toISOString();
}

string Date::toLocaleDateString() const {
    return toDateString();
}

string Date::toLocaleTimeString() const {
    return toTimeString();
}

string Date::toLocaleString() const {
    return toString();
}

// RegExp implementation
RegExp::RegExp(const string& pattern, const string& flags) 
    : pattern_(pattern), flags_(flags), lastIndex_(0) {
    
    std::regex_constants::syntax_option_type options = std::regex_constants::ECMAScript;
    
    global_ = flags.includes("g");
    ignoreCase_ = flags.includes("i");
    multiline_ = flags.includes("m");
    
    if (ignoreCase_) {
        options |= std::regex_constants::icase;
    }
    
    regex_ = std::regex(pattern.getValue(), options);
}

bool RegExp::test(const string& str) const {
    return std::regex_search(str.getValue(), regex_);
}

std::optional<array<string>> RegExp::exec(const string& str) const {
    std::smatch matches;
    if (std::regex_search(str.getValue(), matches, regex_)) {
        array<string> result;
        for (const auto& match : matches) {
            result.push(string(match.str()));
        }
        return result;
    }
    return std::nullopt;
}

string RegExp::toString() const {
    return "/" + pattern_ + "/" + flags_;
}

// Error implementation
Error::Error(const string& message, const string& name) 
    : message_(message), name_(name) {
    // Simplified stack trace
    stack_ = name_ + ": " + message_;
}

// JSON implementation
string JSON::stringify(const any& value, const ReplacerFunc& replacer, const string& space) {
    return stringifyValue(value, replacer, space, 0);
}

string JSON::stringify(const any& value, const array<string>& replacer, const string& space) {
    // Convert array replacer to function replacer
    ReplacerFunc func = [&replacer](const string& key, const any& val) -> any {
        for (size_t i = 0; i < replacer.size(); ++i) {
            if (replacer[i] == key) {
                return val;
            }
        }
        return undefined;
    };
    
    return stringifyValue(value, func, space, 0);
}

any JSON::parse(const string& text, const ReviverFunc& reviver) {
    // Simplified JSON parsing - would need a full JSON parser
    // This is just a placeholder implementation
    return any(text);
}

string JSON::stringifyValue(const any& value, const ReplacerFunc& replacer, const string& space, int indent) {
    try {
        if (std::holds_alternative<undefined_t>(value) || std::holds_alternative<null_t>(value)) {
            return "null";
        } else if (std::holds_alternative<bool>(value)) {
            return std::get<bool>(value) ? "true" : "false";
        } else if (std::holds_alternative<double>(value)) {
            double d = std::get<double>(value);
            if (std::isnan(d) || std::isinf(d)) return "null";
            return string(std::to_string(d));
        } else if (std::holds_alternative<string>(value)) {
            return "\"" + escapeString(std::get<string>(value)) + "\"";
        } else {
            return "{}"; // Simplified for objects and arrays
        }
    } catch (...) {
        return "null";
    }
}

string JSON::escapeString(const string& str) {
    std::string result;
    for (char c : str.getValue()) {
        switch (c) {
            case '"': result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\b': result += "\\b"; break;
            case '\f': result += "\\f"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;
            default: result += c; break;
        }
    }
    return string(result);
}

// Console implementation
void Console::time(const string& label) {
    timers_[label] = std::chrono::steady_clock::now();
}

void Console::timeEnd(const string& label) {
    auto it = timers_.find(label);
    if (it != timers_.end()) {
        auto end = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - it->second);
        std::cout << label.getValue() << ": " << duration.count() << "ms" << std::endl;
        timers_.erase(it);
    }
}

void Console::timeLog(const string& label) {
    auto it = timers_.find(label);
    if (it != timers_.end()) {
        auto end = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - it->second);
        std::cout << label.getValue() << ": " << duration.count() << "ms" << std::endl;
    }
}

void Console::count(const string& label) {
    counters_[label]++;
    std::cout << label.getValue() << ": " << counters_[label] << std::endl;
}

void Console::countReset(const string& label) {
    counters_[label] = 0;
}

void Console::group(const string& label) {
    for (int i = 0; i < groupLevel_; ++i) {
        std::cout << "  ";
    }
    if (!label.empty()) {
        std::cout << label.getValue() << std::endl;
    }
    groupLevel_++;
}

void Console::groupCollapsed(const string& label) {
    group(label);
}

void Console::groupEnd() {
    if (groupLevel_ > 0) {
        groupLevel_--;
    }
}

// Global functions
number parseInt(const string& str, int radix) {
    if (radix != 0 && (radix < 2 || radix > 36)) {
        return number::NaN;
    }
    
    std::string s = str.getValue();
    s = string(s).trim().getValue();
    
    if (s.empty()) return number::NaN;
    
    // Handle sign
    bool negative = false;
    size_t pos = 0;
    if (s[0] == '-') {
        negative = true;
        pos = 1;
    } else if (s[0] == '+') {
        pos = 1;
    }
    
    // Auto-detect radix
    if (radix == 0) {
        if (pos + 1 < s.length() && s[pos] == '0' && (s[pos + 1] == 'x' || s[pos + 1] == 'X')) {
            radix = 16;
            pos += 2;
        } else {
            radix = 10;
        }
    } else if (radix == 16 && pos + 1 < s.length() && s[pos] == '0' && (s[pos + 1] == 'x' || s[pos + 1] == 'X')) {
        pos += 2;
    }
    
    double result = 0;
    for (size_t i = pos; i < s.length(); ++i) {
        char c = s[i];
        int digit;
        
        if (c >= '0' && c <= '9') {
            digit = c - '0';
        } else if (c >= 'a' && c <= 'z') {
            digit = c - 'a' + 10;
        } else if (c >= 'A' && c <= 'Z') {
            digit = c - 'A' + 10;
        } else {
            break; // Invalid character, stop parsing
        }
        
        if (digit >= radix) {
            break; // Invalid digit for this radix
        }
        
        result = result * radix + digit;
    }
    
    return number(negative ? -result : result);
}

number parseFloat(const string& str) {
    std::string s = str.getValue();
    s = string(s).trim().getValue();
    
    if (s.empty()) return number::NaN;
    
    try {
        return number(std::stod(s));
    } catch (...) {
        return number::NaN;
    }
}

bool isNaN(const any& value) {
    try {
        if (std::holds_alternative<double>(value)) {
            return std::isnan(std::get<double>(value));
        } else if (std::holds_alternative<string>(value)) {
            double d = parseFloat(std::get<string>(value));
            return std::isnan(d);
        }
        return false;
    } catch (...) {
        return true;
    }
}

bool isFinite(const any& value) {
    try {
        if (std::holds_alternative<double>(value)) {
            return std::isfinite(std::get<double>(value));
        } else if (std::holds_alternative<string>(value)) {
            double d = parseFloat(std::get<string>(value));
            return std::isfinite(d);
        }
        return false;
    } catch (...) {
        return false;
    }
}

string encodeURI(const string& uri) {
    // Simplified URI encoding
    std::string result;
    for (char c : uri.getValue()) {
        if (std::isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~' || 
            c == ':' || c == '/' || c == '?' || c == '#' || c == '[' || c == ']' ||
            c == '@' || c == '!' || c == '$' || c == '&' || c == '\'' || 
            c == '(' || c == ')' || c == '*' || c == '+' || c == ',' || c == ';' || c == '=') {
            result += c;
        } else {
            std::ostringstream oss;
            oss << '%' << std::hex << std::uppercase << (unsigned char)c;
            result += oss.str();
        }
    }
    return string(result);
}

string decodeURI(const string& encodedURI) {
    // Simplified URI decoding
    std::string result;
    std::string s = encodedURI.getValue();
    
    for (size_t i = 0; i < s.length(); ++i) {
        if (s[i] == '%' && i + 2 < s.length()) {
            int value;
            std::istringstream iss(s.substr(i + 1, 2));
            if (iss >> std::hex >> value) {
                result += static_cast<char>(value);
                i += 2;
            } else {
                result += s[i];
            }
        } else {
            result += s[i];
        }
    }
    
    return string(result);
}

string encodeURIComponent(const string& component) {
    // Simplified URI component encoding
    std::string result;
    for (char c : component.getValue()) {
        if (std::isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            result += c;
        } else {
            std::ostringstream oss;
            oss << '%' << std::hex << std::uppercase << std::setfill('0') << std::setw(2) << (unsigned char)c;
            result += oss.str();
        }
    }
    return string(result);
}

string decodeURIComponent(const string& encodedComponent) {
    return decodeURI(encodedComponent);
}

// Type conversion functions
string toString(const any& value) {
    try {
        if (std::holds_alternative<undefined_t>(value)) {
            return "undefined";
        } else if (std::holds_alternative<null_t>(value)) {
            return "null";
        } else if (std::holds_alternative<bool>(value)) {
            return std::get<bool>(value) ? "true" : "false";
        } else if (std::holds_alternative<double>(value)) {
            double d = std::get<double>(value);
            if (std::isnan(d)) return "NaN";
            if (std::isinf(d)) return d > 0 ? "Infinity" : "-Infinity";
            return string(std::to_string(d));
        } else if (std::holds_alternative<string>(value)) {
            return std::get<string>(value);
        } else {
            return "[object Object]";
        }
    } catch (...) {
        return "[object Object]";
    }
}

number toNumber(const any& value) {
    try {
        if (std::holds_alternative<undefined_t>(value)) {
            return number::NaN;
        } else if (std::holds_alternative<null_t>(value)) {
            return number(0);
        } else if (std::holds_alternative<bool>(value)) {
            return number(std::get<bool>(value) ? 1.0 : 0.0);
        } else if (std::holds_alternative<double>(value)) {
            return number(std::get<double>(value));
        } else if (std::holds_alternative<string>(value)) {
            return parseFloat(std::get<string>(value));
        } else {
            return number::NaN;
        }
    } catch (...) {
        return number::NaN;
    }
}

bool toBoolean(const any& value) {
    try {
        if (std::holds_alternative<undefined_t>(value) || std::holds_alternative<null_t>(value)) {
            return false;
        } else if (std::holds_alternative<bool>(value)) {
            return std::get<bool>(value);
        } else if (std::holds_alternative<double>(value)) {
            double d = std::get<double>(value);
            return !std::isnan(d) && d != 0.0;
        } else if (std::holds_alternative<string>(value)) {
            return !std::get<string>(value).empty();
        } else {
            return true; // Objects are truthy
        }
    } catch (...) {
        return false;
    }
}

// JavaScript operators implemented as functions
string typeof_op(const any& value) {
    try {
        if (std::holds_alternative<undefined_t>(value)) {
            return "undefined";
        } else if (std::holds_alternative<null_t>(value)) {
            return "object";
        } else if (std::holds_alternative<bool>(value)) {
            return "boolean";
        } else if (std::holds_alternative<double>(value)) {
            return "number";
        } else if (std::holds_alternative<string>(value)) {
            return "string";
        } else {
            return "object";
        }
    } catch (...) {
        return "undefined";
    }
}

bool instanceof_op(const any& obj, const any& constructor) {
    // Simplified instanceof implementation
    return false;
}

bool in_op(const string& property, const object& obj) {
    return obj.hasProperty(property);
}

bool delete_op(object& obj, const string& property) {
    obj.deleteProperty(property);
    return true;
}

} // namespace js