#pragma once
#include <map>
#include <shared_mutex>
#include <variant>
#include <optional>
#include <string>

namespace streaming {

class DeltaTracker {
public:
    static DeltaTracker& getInstance() {
        static DeltaTracker instance;
        return instance;
    }

    // Delete copy and move constructors
    DeltaTracker(const DeltaTracker&) = delete;
    DeltaTracker& operator=(const DeltaTracker&) = delete;
    DeltaTracker(DeltaTracker&&) = delete;
    DeltaTracker& operator=(DeltaTracker&&) = delete;

    bool hasChanged(const std::string& varName, double newValue) const;
    void recordSent(const std::string& varName, double value);
    void clear();
    std::optional<double> getLastValue(const std::string& varName) const;

private:
    DeltaTracker() = default;
    
    std::map<std::string, double> m_lastSentValues;
    mutable std::shared_mutex m_mutex;
};

} // namespace streaming
