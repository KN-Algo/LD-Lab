#include "api/VariableInitializer.h"
#include "api/VariableTable.h"
#include <print>

void VariableInitializer::initialize()
{
    auto& variableTable = VariableTable::getInstance();
    
    // Initialize demo variables for testing streaming
    // THIS VARIABLES ARE ONLY FOR DEMONSTRATION PURPOSES AND SHOULD NOT BE USED IN PRODUCTION CODE
    variableTable.create("flag", VariableType::BOOL, false);
    variableTable.create("counter", VariableType::INT, 0);
    variableTable.create("temperature", VariableType::FLOAT, 20.5f);
    variableTable.create("circleSize", VariableType::FLOAT, 50.0f);
    
    std::println("[VariableInitializer] Variables initialized");
}
