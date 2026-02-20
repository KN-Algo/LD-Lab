#include "api/VariableTable.h"
#include <saucer/smartview.hpp>
#include <stdexcept>
#include <print>

VariableTable& VariableTable::getInstance() {
    static VariableTable instance;
    return instance;
}

void VariableTable::validateType(const std::string& name, VariableType expectedType) const {
    auto it = m_variables.find(name);
    if (it == m_variables.end()) {
        throw std::runtime_error("Variable '" + name + "' not found");
    }
    if (it->second.type != expectedType) {
        throw std::runtime_error("Type mismatch for variable '" + name + "'");
    }
}

Variable VariableTable::get(const std::string& name) const {
    std::shared_lock lock(m_mutex);
    auto it = m_variables.find(name);
    if (it == m_variables.end()) {
        throw std::runtime_error("Variable '" + name + "' not found");
    }
    return it->second;
}

void VariableTable::set(const std::string& name, VariableType type, const VariableValue& value) {
    std::unique_lock lock(m_mutex);
    
    validateType(name, type);
    
    Variable& var = m_variables[name];
    
    // Only trigger callbacks if value actually changed
    bool changed = false;
    if (std::holds_alternative<bool>(var.value) && std::holds_alternative<bool>(value)) {
        changed = std::get<bool>(var.value) != std::get<bool>(value);
    } else if (std::holds_alternative<int>(var.value) && std::holds_alternative<int>(value)) {
        changed = std::get<int>(var.value) != std::get<int>(value);
    } else if (std::holds_alternative<float>(var.value) && std::holds_alternative<float>(value)) {
        changed = std::get<float>(var.value) != std::get<float>(value);
    }
    
    if (!changed) {
        return;  // No change, don't trigger callbacks
    }
    
    var.value = value;
    
    // Push notification to frontend (if webview is set)
    notifyFrontend(var);
    
    // Notify all subscribers for this variable
    for (const auto& [subId, subscriber] : m_subscribers) {
        if (subscriber.first == name) {
            try {
                subscriber.second(var);
            } catch (const std::exception& e) {
                std::println(stderr, "Error in variable change callback: {}", e.what());
            }
        }
    }
}

void VariableTable::create(const std::string& name, VariableType type, const VariableValue& value) {
    std::unique_lock lock(m_mutex);
    
    if (m_variables.find(name) != m_variables.end()) {
        throw std::runtime_error("Variable '" + name + "' already exists");
    }
    
    // Validate value type matches declared type
    bool typeMatch = false;
    switch (type) {
        case VariableType::BOOL:
            typeMatch = std::holds_alternative<bool>(value);
            break;
        case VariableType::INT:
            typeMatch = std::holds_alternative<int>(value);
            break;
        case VariableType::FLOAT:
            typeMatch = std::holds_alternative<float>(value);
            break;
    }
    
    if (!typeMatch) {
        throw std::runtime_error("Type mismatch when creating variable '" + name + "'");
    }
    
    m_variables[name] = Variable{name, type, value};
}

std::map<std::string, Variable> VariableTable::getAll() const {
    std::shared_lock lock(m_mutex);
    return m_variables;
}

void VariableTable::remove(const std::string& name) {
    std::unique_lock lock(m_mutex);
    
    if (m_variables.erase(name) == 0) {
        throw std::runtime_error("Variable '" + name + "' not found");
    }
    
    // Remove all subscriptions for this variable
    for (auto it = m_subscribers.begin(); it != m_subscribers.end();) {
        if (it->second.first == name) {
            it = m_subscribers.erase(it);
        } else {
            ++it;
        }
    }
}

bool VariableTable::exists(const std::string& name) const {
    std::shared_lock lock(m_mutex);
    return m_variables.find(name) != m_variables.end();
}

int VariableTable::subscribe(const std::string& varName, VariableChangeCallback callback) {
    std::unique_lock lock(m_mutex);
    
    // Verify variable exists
    if (m_variables.find(varName) == m_variables.end()) {
        throw std::runtime_error("Cannot subscribe to non-existent variable '" + varName + "'");
    }
    
    int subscriptionId = m_nextSubscriptionId++;
    m_subscribers[subscriptionId] = {varName, callback};
    
    std::println("Subscribed to variable '{}' with ID {}", varName, subscriptionId);
    
    return subscriptionId;
}

void VariableTable::unsubscribe(int subscriptionId) {
    std::unique_lock lock(m_mutex);
    
    if (m_subscribers.erase(subscriptionId) == 0) {
        std::println(stderr, "Subscription ID {} not found", subscriptionId);
    } else {
        std::println("Unsubscribed from ID {}", subscriptionId);
    }
}

void VariableTable::clear() {
    std::unique_lock lock(m_mutex);
    m_variables.clear();
    m_subscribers.clear();
    m_nextSubscriptionId = 1;
}

void VariableTable::setWebview(void* webview) {
    m_webview = webview;
    std::println("[VariableTable] Webview set for push notifications");
}

void VariableTable::notifyFrontend(const Variable& var) {
    if (!m_webview) {
        return;  // No webview set, skip push notification
    }
    
    // Throttle push notifications to prevent flooding (max ~60fps per variable)
    auto now = std::chrono::steady_clock::now();
    auto lastPush = m_lastPushTime.find(var.name);
    
    if (lastPush != m_lastPushTime.end()) {
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastPush->second);
        if (elapsed < PUSH_THROTTLE_MS) {
            // Too soon, skip this push
            return;
        }
    }
    
    // Update last push time
    m_lastPushTime[var.name] = now;
    
    try {
        // Cast void* back to saucer::smartview*
        auto* webview = static_cast<saucer::smartview*>(m_webview);
        // Convert value to double for JavaScript
        double jsValue = 0.0;
        if (std::holds_alternative<bool>(var.value)) {
            jsValue = std::get<bool>(var.value) ? 1.0 : 0.0;
        } else if (std::holds_alternative<int>(var.value)) {
            jsValue = static_cast<double>(std::get<int>(var.value));
        } else if (std::holds_alternative<float>(var.value)) {
            jsValue = static_cast<double>(std::get<float>(var.value));
        }
        
        // Convert type to string
        std::string typeStr;
        switch (var.type) {
            case VariableType::BOOL: typeStr = "BOOL"; break;
            case VariableType::INT: typeStr = "INT"; break;
            case VariableType::FLOAT: typeStr = "FLOAT"; break;
        }
        
        // Execute JavaScript to notify frontend using smartview's built-in formatting
        // Call window.onVariableChange(name, type, value) if it exists
        webview->execute(
            "if (window.onVariableChange) {{ window.onVariableChange({}, {}, {}); }}",
            var.name, typeStr, jsValue
        );
        
    } catch (const std::exception& e) {
        std::println(stderr, "[VariableTable] Error pushing to frontend: {}", e.what());
    }
}
