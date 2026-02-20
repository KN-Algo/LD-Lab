#pragma once

#include <thread>
#include <atomic>

/// Service for updating variables periodically in the background
/// 
/// Simulates dynamic variable changes for demonstration and testing purposes.
/// Runs in a detached background thread.
class VariableUpdater {
public:
    /// Start the background update thread
    /// Updates counter, flag, and temperature variables
    static void start();

    /// Stop the background update thread
    static void stop();

private:
    VariableUpdater() = default;

    /// Background thread worker function
    static void updateThread();

    /// Flag to control thread execution
    static std::atomic<bool> running;

    /// The actual thread object
    static std::thread thread;
};
