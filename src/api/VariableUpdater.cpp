#include "api/VariableUpdater.h"
#include "api/VariableTable.h"
#include <chrono>
#include <print>
#include <numbers>

std::atomic<bool> VariableUpdater::running{false};
std::thread VariableUpdater::thread;

void VariableUpdater::start()
{
    if (running.exchange(true)) {
        return;  // Already running
    }

    thread = std::thread(&VariableUpdater::updateThread);
    std::println("[VariableUpdater] Background update thread started");
}

void VariableUpdater::stop()
{
    running = false;
    if (thread.joinable()) {
        thread.join();
    }
}

void VariableUpdater::updateThread()
{
    auto& variableTable = VariableTable::getInstance();
    int counter = 0;

    while (running) {
        std::this_thread::sleep_for(std::chrono::milliseconds(500));

        // Update counter (0 to 100)
        counter = (counter + 1) % 101;
        variableTable.set("counter", VariableType::INT, counter);

        // Toggle flag every 2 seconds
        bool flagValue = (counter / 50) % 2 == 0;
        variableTable.set("flag", VariableType::BOOL, flagValue);

        // Update temperature (sine wave between 10-30)
        float temperature = 20.0f + 10.0f * std::sin(counter * std::numbers::pi_v<float> / 50.0f);
        variableTable.set("temperature", VariableType::FLOAT, temperature);

        if (counter % 20 == 0) {
            std::println("[VariableUpdater] Updated variables - counter: {}, flag: {}, temperature: {:.2f}",
                       counter, flagValue, temperature);
        }
    }
}