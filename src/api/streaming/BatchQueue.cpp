#include "api/streaming/BatchQueue.h"
#include <vector>
#include <iostream>

namespace streaming {

BatchQueue::BatchQueue() {
    m_lastFlush = std::chrono::steady_clock::now();
    m_flushThread = std::thread([this]() { flushWorker(); });
}

BatchQueue::~BatchQueue() {
    m_running = false;
    m_threadCv.notify_all();
    if (m_flushThread.joinable()) {
        m_flushThread.join();
    }
    flush();  // Final flush on shutdown
}

void BatchQueue::configure(
    size_t batchSizeThreshold,
    std::chrono::milliseconds batchIntervalMs
) {
    std::unique_lock lock(m_mutex);
    m_batchSizeThreshold = batchSizeThreshold;
    m_batchInterval = batchIntervalMs;
}

void BatchQueue::enqueue(
    const std::string& varName,
    const std::string& typeStr,
    double value
) {
    {
        std::unique_lock lock(m_mutex);
        m_queue.push({varName, typeStr, value});
    }
    m_threadCv.notify_one();  // Wake flush thread
}

void BatchQueue::onFlush(FlushCallback callback) {
    std::unique_lock lock(m_mutex);
    m_flushCallback = callback;
}

void BatchQueue::flush() {
    performFlush();
}

BatchQueue::Stats BatchQueue::getStats() const {
    std::shared_lock lock(m_mutex);
    Stats stats = m_stats;
    stats.currentQueueSize = m_queue.size();
    return stats;
}

void BatchQueue::flushWorker() {
    while (m_running) {
        std::unique_lock lock(m_mutex);
        
        // Wait until we have enough items or timeout occurs
        m_threadCv.wait_for(lock, m_batchInterval, [this]() {
            return !m_running || m_queue.size() >= m_batchSizeThreshold;
        });

        if (!m_running && m_queue.empty()) {
            break;
        }

        auto now = std::chrono::steady_clock::now();
        bool shouldFlush = m_queue.size() >= m_batchSizeThreshold || 
                           (now - m_lastFlush) >= m_batchInterval;

        if (shouldFlush && !m_queue.empty()) {
            lock.unlock();
            performFlush();
        }
    }
}

void BatchQueue::performFlush() {
    std::vector<PendingUpdate> updates;
    FlushCallback callback;

    {
        std::unique_lock lock(m_mutex);
        if (m_queue.empty() || !m_flushCallback) {
            return;
        }

        // Extract up to m_batchSizeThreshold items, or all if we want to flush everything
        while (!m_queue.empty()) {
            updates.push_back(std::move(m_queue.front()));
            m_queue.pop();
        }
        
        callback = m_flushCallback;
        m_lastFlush = std::chrono::steady_clock::now();
        
        m_stats.totalBatchesSent++;
        m_stats.totalVariablesSent += updates.size();
    }

    // Convert to VariableEntry
    std::vector<VariableEntry> entries;
    entries.reserve(updates.size());
    for (const auto& update : updates) {
        entries.push_back(BinaryEncoder::makeEntry(update.name, update.typeStr, update.value));
    }

    // Encode
    auto nowMs = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
    
    std::vector<uint8_t> binaryData = BinaryEncoder::encodeBatch(entries, static_cast<uint32_t>(nowMs));

    // Call callback outside of lock
    callback(binaryData);
}

} // namespace streaming
