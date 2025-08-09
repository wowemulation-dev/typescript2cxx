#ifndef JS_ASYNC_H
#define JS_ASYNC_H

#include <coroutine>
#include <exception>
#include <memory>
#include <functional>
#include <variant>
#include <optional>
#include <vector>
#include <queue>
#include <atomic>

namespace js {

// Forward declarations
template<typename T> class Promise;
template<typename T> class Task;

// Promise states
enum class PromiseState {
    Pending,
    Fulfilled,
    Rejected
};

// Promise result type
template<typename T>
using PromiseResult = std::variant<std::monostate, T, std::exception_ptr>;

// Promise implementation
template<typename T>
class Promise : public std::enable_shared_from_this<Promise<T>> {
public:
    using value_type = T;
    using callback_type = std::function<void(const T&)>;
    using error_callback_type = std::function<void(std::exception_ptr)>;
    
    Promise() : state_(PromiseState::Pending) {}
    
    // Executor constructor
    template<typename Executor>
    explicit Promise(Executor&& executor) : state_(PromiseState::Pending) {
        try {
            executor(
                [this](const T& value) { resolve(value); },
                [this](std::exception_ptr error) { reject(error); }
            );
        } catch (...) {
            reject(std::current_exception());
        }
    }
    
    // Static factory methods
    static std::shared_ptr<Promise<T>> resolve(const T& value) {
        auto promise = std::make_shared<Promise<T>>();
        promise->resolve(value);
        return promise;
    }
    
    static std::shared_ptr<Promise<T>> reject(std::exception_ptr error) {
        auto promise = std::make_shared<Promise<T>>();
        promise->reject(error);
        return promise;
    }
    
    // Then method for chaining
    template<typename OnFulfilled>
    auto then(OnFulfilled&& onFulfilled) -> std::shared_ptr<Promise<decltype(onFulfilled(std::declval<T>()))>> {
        using ReturnType = decltype(onFulfilled(std::declval<T>()));
        auto nextPromise = std::make_shared<Promise<ReturnType>>();
        
        addCallback([nextPromise, onFulfilled = std::forward<OnFulfilled>(onFulfilled)](const T& value) {
            try {
                if constexpr (std::is_void_v<ReturnType>) {
                    onFulfilled(value);
                    nextPromise->resolve();
                } else {
                    nextPromise->resolve(onFulfilled(value));
                }
            } catch (...) {
                nextPromise->reject(std::current_exception());
            }
        });
        
        addErrorCallback([nextPromise](std::exception_ptr error) {
            nextPromise->reject(error);
        });
        
        return nextPromise;
    }
    
    // Catch method for error handling
    std::shared_ptr<Promise<T>> catch_(error_callback_type onRejected) {
        auto nextPromise = std::make_shared<Promise<T>>();
        
        addCallback([nextPromise](const T& value) {
            nextPromise->resolve(value);
        });
        
        addErrorCallback([nextPromise, onRejected](std::exception_ptr error) {
            try {
                onRejected(error);
                // If error handler doesn't throw, consider it handled
                // This is simplified - real implementation would need more logic
            } catch (...) {
                nextPromise->reject(std::current_exception());
            }
        });
        
        return nextPromise;
    }
    
    // Get the value (blocking - for testing)
    T get() {
        // This is a simplified synchronous version
        // Real implementation would need proper synchronization
        if (state_ == PromiseState::Fulfilled) {
            return std::get<T>(result_);
        } else if (state_ == PromiseState::Rejected) {
            std::rethrow_exception(std::get<std::exception_ptr>(result_));
        }
        throw std::runtime_error("Promise is still pending");
    }
    
    PromiseState state() const { return state_; }
    
    // Coroutine support
    bool await_ready() const noexcept {
        return state_ != PromiseState::Pending;
    }
    
    void await_suspend(std::coroutine_handle<> handle) {
        addCallback([handle](const T&) { handle.resume(); });
        addErrorCallback([handle](std::exception_ptr) { handle.resume(); });
    }
    
    T await_resume() {
        if (state_ == PromiseState::Fulfilled) {
            return std::get<T>(result_);
        }
        std::rethrow_exception(std::get<std::exception_ptr>(result_));
    }
    
    // Promise.all - wait for all promises to resolve
    static std::shared_ptr<Promise<std::vector<T>>> all(const std::vector<std::shared_ptr<Promise<T>>>& promises) {
        auto resultPromise = std::make_shared<Promise<std::vector<T>>>();
        auto results = std::make_shared<std::vector<T>>();
        auto completed = std::make_shared<std::atomic<size_t>>(0);
        
        if (promises.empty()) {
            resultPromise->resolve(std::vector<T>{});
            return resultPromise;
        }
        
        results->resize(promises.size());
        
        for (size_t i = 0; i < promises.size(); ++i) {
            promises[i]->then([resultPromise, results, completed, i, total = promises.size()](const T& value) {
                (*results)[i] = value;
                if (++(*completed) == total) {
                    resultPromise->resolve(*results);
                }
            })->catch_([resultPromise](std::exception_ptr error) {
                resultPromise->reject(error);
            });
        }
        
        return resultPromise;
    }

    // Promise.race - resolve/reject with first settled promise
    static std::shared_ptr<Promise<T>> race(const std::vector<std::shared_ptr<Promise<T>>>& promises) {
        auto resultPromise = std::make_shared<Promise<T>>();
        auto settled = std::make_shared<std::atomic<bool>>(false);
        
        for (const auto& promise : promises) {
            promise->then([resultPromise, settled](const T& value) {
                bool expected = false;
                if (settled->compare_exchange_strong(expected, true)) {
                    resultPromise->resolve(value);
                }
            })->catch_([resultPromise, settled](std::exception_ptr error) {
                bool expected = false;
                if (settled->compare_exchange_strong(expected, true)) {
                    resultPromise->reject(error);
                }
            });
        }
        
        return resultPromise;
    }
    
private:
    void resolve(const T& value) {
        if (state_ != PromiseState::Pending) return;
        
        state_ = PromiseState::Fulfilled;
        result_ = value;
        
        for (auto& callback : callbacks_) {
            callback(value);
        }
        callbacks_.clear();
    }
    
    void reject(std::exception_ptr error) {
        if (state_ != PromiseState::Pending) return;
        
        state_ = PromiseState::Rejected;
        result_ = error;
        
        for (auto& callback : errorCallbacks_) {
            callback(error);
        }
        errorCallbacks_.clear();
    }
    
    void addCallback(callback_type callback) {
        if (state_ == PromiseState::Fulfilled) {
            callback(std::get<T>(result_));
        } else if (state_ == PromiseState::Pending) {
            callbacks_.push_back(callback);
        }
    }
    
    void addErrorCallback(error_callback_type callback) {
        if (state_ == PromiseState::Rejected) {
            callback(std::get<std::exception_ptr>(result_));
        } else if (state_ == PromiseState::Pending) {
            errorCallbacks_.push_back(callback);
        }
    }
    
    PromiseState state_;
    PromiseResult<T> result_;
    std::vector<callback_type> callbacks_;
    std::vector<error_callback_type> errorCallbacks_;
};

// Specialization for void
template<>
class Promise<void> : public std::enable_shared_from_this<Promise<void>> {
public:
    using callback_type = std::function<void()>;
    using error_callback_type = std::function<void(std::exception_ptr)>;
    
    Promise() : state_(PromiseState::Pending) {}
    
    static std::shared_ptr<Promise<void>> resolve() {
        auto promise = std::make_shared<Promise<void>>();
        promise->resolve();
        return promise;
    }
    
    static std::shared_ptr<Promise<void>> reject(std::exception_ptr error) {
        auto promise = std::make_shared<Promise<void>>();
        promise->reject(error);
        return promise;
    }
    
    void resolve() {
        if (state_ != PromiseState::Pending) return;
        state_ = PromiseState::Fulfilled;
        for (auto& callback : callbacks_) {
            callback();
        }
        callbacks_.clear();
    }
    
    void reject(std::exception_ptr error) {
        if (state_ != PromiseState::Pending) return;
        state_ = PromiseState::Rejected;
        error_ = error;
        for (auto& callback : errorCallbacks_) {
            callback(error);
        }
        errorCallbacks_.clear();
    }
    
    bool await_ready() const noexcept {
        return state_ != PromiseState::Pending;
    }
    
    void await_suspend(std::coroutine_handle<> handle) {
        callbacks_.push_back([handle]() { handle.resume(); });
        errorCallbacks_.push_back([handle](std::exception_ptr) { handle.resume(); });
    }
    
    void await_resume() {
        if (state_ == PromiseState::Rejected && error_) {
            std::rethrow_exception(error_);
        }
    }
    
private:
    PromiseState state_;
    std::optional<std::exception_ptr> error_;
    std::vector<callback_type> callbacks_;
    std::vector<error_callback_type> errorCallbacks_;
};

// Task - coroutine return type
template<typename T = void>
class Task {
public:
    struct promise_type {
        std::shared_ptr<Promise<T>> promise = std::make_shared<Promise<T>>();
        
        Task get_return_object() {
            return Task{promise};
        }
        
        std::suspend_never initial_suspend() noexcept { return {}; }
        std::suspend_never final_suspend() noexcept { return {}; }
        
        template<typename U>
        void return_value(U&& value) {
            promise->resolve(std::forward<U>(value));
        }
        
        void unhandled_exception() {
            promise->reject(std::current_exception());
        }
    };
    
    explicit Task(std::shared_ptr<Promise<T>> p) : promise_(p) {}
    
    // Make Task awaitable
    bool await_ready() const noexcept {
        return promise_->await_ready();
    }
    
    void await_suspend(std::coroutine_handle<> handle) {
        promise_->await_suspend(handle);
    }
    
    T await_resume() {
        return promise_->await_resume();
    }
    
    // Convert to Promise for compatibility
    operator std::shared_ptr<Promise<T>>() const {
        return promise_;
    }
    
    std::shared_ptr<Promise<T>> promise() const {
        return promise_;
    }
    
private:
    std::shared_ptr<Promise<T>> promise_;
};

// Specialization for void
template<>
class Task<void> {
public:
    struct promise_type {
        std::shared_ptr<Promise<void>> promise = std::make_shared<Promise<void>>();
        
        Task get_return_object() {
            return Task{promise};
        }
        
        std::suspend_never initial_suspend() noexcept { return {}; }
        std::suspend_never final_suspend() noexcept { return {}; }
        
        void return_void() {
            promise->resolve();
        }
        
        void unhandled_exception() {
            promise->reject(std::current_exception());
        }
    };
    
    explicit Task(std::shared_ptr<Promise<void>> p) : promise_(p) {}
    
    bool await_ready() const noexcept {
        return promise_->await_ready();
    }
    
    void await_suspend(std::coroutine_handle<> handle) {
        promise_->await_suspend(handle);
    }
    
    void await_resume() {
        promise_->await_resume();
    }
    
    operator std::shared_ptr<Promise<void>>() const {
        return promise_;
    }
    
    std::shared_ptr<Promise<void>> promise() const {
        return promise_;
    }
    
private:
    std::shared_ptr<Promise<void>> promise_;
};

} // namespace js

#endif // JS_ASYNC_H