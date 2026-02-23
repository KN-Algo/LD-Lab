#include "api/streaming/DeltaTracker.h"
#include <cmath>

namespace streaming {

bool DeltaTracker::hasChanged(const std::string& varName, double newValue) const {
    std::shared_lock lock(m_mutex);
    auto it = m_lastSentValues.find(varName);
    if (it == m_lastSentValues.end()) {
        return true; // Never sent before
    }
    
    // Use epsilon for floating point comparison
    constexpr double epsilon = 1e-9;
    return std::fabs(it->second - newValue) > epsilon;
}

void DeltaTracker::recordSent(const std::string& varName, double value) {
    std::unique_lock lock(m_mutex);
    m_lastSentValues[varName] = value;
}

void DeltaTracker::clear() {
    std::unique_lock lock(m_mutex);
    m_lastSentValues.clear();
}

std::optional<double> DeltaTracker::getLastValue(const std::string& varName) const {
    std::shared_lock lock(m_mutex);
    auto it = m_lastSentValues.find(varName);
    if (it != m_lastSentValues.end()) {
        return it->second;
    }
    return std::nullopt;
}

} // namespace streaming
