#pragma once

#include <variant>
#include <map>
#include <memory>
#include <functional>
#include <shared_mutex>
#include <string>
#include <chrono>

/// Variable type enumeration
enum class VariableType {
    BOOL,
    INT,
    FLOAT
};

/// Variable value type (can hold bool, int, or float)
using VariableValue = std::variant<bool, int, float>;

/// Represents a single variable with metadata
struct Variable {
    std::string name;
    VariableType type;
    VariableValue value;
};

/// Callback invoked when a variable changes
using VariableChangeCallback = std::function<void(const Variable&)>;

/// Thread-safe singleton storing and managing all variables
/// 
/// Features:
/// - Thread-safe read/write access with std::shared_mutex
/// - Type-safe variable storage (BOOL, INT, FLOAT)
/// - Observer pattern for change notifications
/// - Manages subscriptions with unique IDs
class VariableTable {
public:
    /// Get singleton instance
    static VariableTable& getInstance();
    
    // Non-copyable, non-movable singleton
    VariableTable(const VariableTable&) = delete;
    VariableTable(VariableTable&&) = delete;
    VariableTable& operator=(const VariableTable&) = delete;
    VariableTable& operator=(VariableTable&&) = delete;
    
    /// Get a variable by name
    /// @param name Variable name
    /// @return Variable struct with current value
    /// @throws std::runtime_error if variable not found
    Variable get(const std::string& name) const;
    
    /// Set a variable value (triggers change callbacks if value differs)
    /// @param name Variable name
    /// @param type Variable type
    /// @param value Variable value
    /// @throws std::runtime_error if variable doesn't exist or type mismatch
    void set(const std::string& name, VariableType type, const VariableValue& value);
    
    /// Create a new variable
    /// @param name Variable name (must be unique)
    /// @param type Variable type
    /// @param value Initial value
    /// @throws std::runtime_error if variable already exists or type mismatch
    void create(const std::string& name, VariableType type, const VariableValue& value);
    
    /// Get all variables as a map
    /// @return Map of all variables (name -> Variable)
    std::map<std::string, Variable> getAll() const;
    
    /// Remove a variable
    /// @param name Variable name
    void remove(const std::string& name);
    
    /// Check if variable exists
    /// @param name Variable name
    /// @return true if variable exists
    bool exists(const std::string& name) const;
    
    /// Subscribe to variable changes
    /// @param varName Variable name
    /// @param callback Function to call when variable changes
    /// @return Subscription ID (used for unsubscribe)
    int subscribe(const std::string& varName, VariableChangeCallback callback);
    
    /// Unsubscribe from variable changes
    /// @param subscriptionId ID returned by subscribe()
    void unsubscribe(int subscriptionId);
    
    /// Set webview for push notifications
    /// @param webview Pointer to saucer smartview (for JS execution)
    void setWebview(void* webview);
    
    /// Clear all variables and subscriptions
    void clear();
    
private:
    VariableTable() = default;
    
    // Member variables
    std::map<std::string, Variable> m_variables;
    std::map<int, std::pair<std::string, VariableChangeCallback>> m_subscribers;
    int m_nextSubscriptionId = 1;
    mutable std::shared_mutex m_mutex;
    void* m_webview = nullptr;  // For push notifications (saucer::smartview*)
    
    // Throttling for push notifications (per variable)
    std::map<std::string, std::chrono::steady_clock::time_point> m_lastPushTime;
    static constexpr std::chrono::milliseconds PUSH_THROTTLE_MS{16}; // ~60fps
    
    /// Helper to validate type matches
    void validateType(const std::string& name, VariableType expectedType) const;
    
    /// Helper to push variable change to frontend via JavaScript
    void notifyFrontend(const Variable& var);
};
