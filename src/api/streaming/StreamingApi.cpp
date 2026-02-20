#include "api/streaming/StreamingApi.h"
#include "api/VariableTable.h"
#include <print>
#include <glaze/glaze.hpp>
#include <map>

/// Response structure for a single variable
struct VariableResponse {
    std::string name;
    std::string type;  // "BOOL", "INT", or "FLOAT"
    double value;  // Simplified to double; will be cast appropriately
};

/// Response structure for all variables
struct AllVariablesResponse {
    std::map<std::string, VariableResponse> variables;
};

/// Error response
struct ErrorResponse {
    std::string error;
};

/// Helper to convert VariableType to string
static std::string variableTypeToString(VariableType type) {
    switch (type) {
        case VariableType::BOOL:
            return "BOOL";
        case VariableType::INT:
            return "INT";
        case VariableType::FLOAT:
            return "FLOAT";
        default:
            return "UNKNOWN";
    }
}

/// Helper to convert Variable to VariableResponse
static VariableResponse variableToResponse(const Variable& var) {
    double value = 0.0;

    // Convert variant value to double
    if (std::holds_alternative<bool>(var.value)) {
        value = std::get<bool>(var.value) ? 1.0 : 0.0;
    } else if (std::holds_alternative<int>(var.value)) {
        value = static_cast<double>(std::get<int>(var.value));
    } else if (std::holds_alternative<float>(var.value)) {
        value = static_cast<double>(std::get<float>(var.value));
    }
    
    return VariableResponse{
        var.name,
        variableTypeToString(var.type),
        value
    };
}

void StreamingApi::registerStreamingApi(saucer::smartview& webview) {
    std::println("Rejestrowanie: Streaming API (Variable Table)");
    
    auto& table = VariableTable::getInstance();
    
    // =====================================================
    // FUNCTION: get_variable
    // Returns a single variable by name
    // =====================================================
    webview.expose("get_variable", [](const std::string& varName) -> VariableResponse {
        try {
            std::println("get_variable({})", varName);
            Variable var = VariableTable::getInstance().get(varName);
            return variableToResponse(var);
        } catch (const std::exception& e) {
            std::println(stderr, "get_variable error: {}", e.what());
            // Return a default response with error in name field
            return VariableResponse{"ERROR", "ERROR", 0.0};
        }
    });
    
    // =====================================================
    // FUNCTION: get_all_variables
    // Returns all variables in the table
    // =====================================================
    webview.expose("get_all_variables", []() -> AllVariablesResponse {
        try {
            std::println("get_all_variables()");
            auto allVars = VariableTable::getInstance().getAll();
            
            AllVariablesResponse response;
            for (const auto& [name, var] : allVars) {
                response.variables[name] = variableToResponse(var);
            }
            return response;
        } catch (const std::exception& e) {
            std::println(stderr, "get_all_variables error: {}", e.what());
            return AllVariablesResponse{};
        }
    });
    
    // =====================================================
    // FUNCTION: subscribe_variable
    // Subscribes to variable changes (returns subscription ID)
    // Note: Actual streaming updates require polling via get_variable()
    //       or implementing JavaScript callbacks (future enhancement)
    // =====================================================
    webview.expose("subscribe_variable", [](const std::string& varName) -> int {
        try {
            std::println("subscribe_variable({})", varName);
            
            // Create a callback when variable changes
            auto callback = [varName](const Variable& var) {
                std::println("Variable '{}' changed", varName);
                // Note: Because frontend uses polling (get_variable),
                // the changed value is fetched on the next poll cycle.
                // Real-time push notifications (WebSocket) are a future enhancement.
            };
            
            int subscriptionId = VariableTable::getInstance().subscribe(varName, callback);
            return subscriptionId;
        } catch (const std::exception& e) {
            std::println(stderr, "subscribe_variable error: {}", e.what());
            return -1;  // Error indicator
        }
    });
    
    // =====================================================
    // FUNCTION: unsubscribe_variable
    // Unsubscribes from variable changes
    // =====================================================
    webview.expose("unsubscribe_variable", [](int subscriptionId) -> void {
        try {
            std::println("unsubscribe_variable({})", subscriptionId);
            VariableTable::getInstance().unsubscribe(subscriptionId);
        } catch (const std::exception& e) {
            std::println(stderr, "unsubscribe_variable error: {}", e.what());
        }
    });
    
    // =====================================================
    // FUNCTION: set_variable
    // Sets a variable value from frontend
    // =====================================================
    webview.expose("set_variable", 
        [](const std::string& varName, const std::string& typeStr, double value) -> bool {
        try {
            std::println("set_variable({}, {}, {})", varName, typeStr, value);
            
            auto& table = VariableTable::getInstance();
            Variable var = table.get(varName);  // Get existing variable to get type
            
            // Convert string type to VariableType
            VariableType type = var.type;
            if (typeStr == "BOOL") type = VariableType::BOOL;
            else if (typeStr == "INT") type = VariableType::INT;
            else if (typeStr == "FLOAT") type = VariableType::FLOAT;
            
            // Convert double to appropriate type
            if (type == VariableType::BOOL) {
                table.set(varName, type, value != 0.0);
            } else if (type == VariableType::INT) {
                table.set(varName, type, static_cast<int>(value));
            } else if (type == VariableType::FLOAT) {
                table.set(varName, type, static_cast<float>(value));
            }
            
            std::println("Variable '{}' set successfully", varName);
            return true;
        } catch (const std::exception& e) {
            std::println(stderr, "set_variable error: {}", e.what());
            return false;
        }
    });
    
    // =====================================================
    // FUNCTION: create_variable
    // Creates a new variable in the Variable Table
    // =====================================================
    webview.expose("create_variable",
        [](const std::string& varName, const std::string& typeStr, double initialValue) -> bool {
        try {
            std::println("create_variable({}, {}, {})", varName, typeStr, initialValue);
            
            auto& table = VariableTable::getInstance();
            
            // Convert string type to VariableType
            VariableType type = VariableType::BOOL;
            if (typeStr == "BOOL") type = VariableType::BOOL;
            else if (typeStr == "INT") type = VariableType::INT;
            else if (typeStr == "FLOAT") type = VariableType::FLOAT;
            else {
                std::println(stderr, "create_variable error: Unknown type '{}'", typeStr);
                return false;
            }
            
            // Convert double to appropriate type based on the type string
            if (type == VariableType::BOOL) {
                table.create(varName, type, initialValue != 0.0);
            } else if (type == VariableType::INT) {
                table.create(varName, type, static_cast<int>(initialValue));
            } else if (type == VariableType::FLOAT) {
                table.create(varName, type, static_cast<float>(initialValue));
            }
            
            std::println("Variable '{}' created successfully with initial value {}", varName, initialValue);
            return true;
        } catch (const std::exception& e) {
            std::println(stderr, "create_variable error: {}", e.what());
            return false;
        }
    });
    
    std::println("Streaming API zarejestrowane pomyślnie!");
}
