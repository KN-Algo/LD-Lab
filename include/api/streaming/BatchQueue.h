#pragma once
#include "api/streaming/BinaryProtocol.h"
#include <queue>
#include <shared_mutex>
#include <thread>
#include <condition_variable>
#include <functional>
#include <chrono>
#include <atomic>

namespace streaming {

class BatchQueue {
public:
    using FlushCallback = std::function<void(const std::vector<uint8_t>&)>;

    struct Stats {
        size_t totalBatchesSent = 0;
        size_t totalVariablesSent = 0;
        size_t currentQueueSize = 0;
    };

    static BatchQueue& getInstance() {
        static BatchQueue instance;
        return instance;
    }

    // Delete copy and move constructors
    BatchQueue(const BatchQueue&) = delete;
    BatchQueue& operator=(const BatchQueue&) = delete;
    BatchQueue(BatchQueue&&) = delete;
    BatchQueue& operator=(BatchQueue&&) = delete;

    ~BatchQueue();

    void configure(
        size_t batchSizeThreshold,
        std::chrono::milliseconds batchIntervalMs
    );

    void enqueue(
        const std::string& varName,
        const std::string& typeStr,
        double value
    );

    void onFlush(FlushCallback callback);
    void flush();
    Stats getStats() const;

private:
    BatchQueue();

    struct PendingUpdate {
        std::string name;
        std::string typeStr;
        double value;
    };

    void flushWorker();
    void performFlush();

    mutable std::shared_mutex m_mutex;
    std::queue<PendingUpdate> m_queue;
    
    size_t m_batchSizeThreshold = 10;
    std::chrono::milliseconds m_batchInterval{16};
    
    FlushCallback m_flushCallback;
    
    std::atomic<bool> m_running{true};
    std::thread m_flushThread;
    std::condition_variable_any m_threadCv;
    std::chrono::steady_clock::time_point m_lastFlush;

    Stats m_stats;
};

} // namespace streaming
