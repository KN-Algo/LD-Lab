#pragma once

/// Service for initializing default variables
/// 
/// Separates variable setup from main.cpp
/// Initializes demo variables: flag, counter, temperature
class VariableInitializer {
public:
    /// Initialize default variables for testing/demo
    /// Creates: flag (BOOL), counter (INT), temperature (FLOAT)
    static void initialize();

private:
    VariableInitializer() = default;
};
