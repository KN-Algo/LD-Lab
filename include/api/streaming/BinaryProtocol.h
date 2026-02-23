#pragma once
#include <vector>
#include <string>
#include <cstdint>
#include <variant>

namespace streaming {

// Message types (wire protocol)
enum class MessageType : uint8_t {
    BATCH_UPDATE = 0x01,    // Single backend -> frontend message
    CONTROL = 0x02,         // For future: subscription control
};

// Variable type encoding
enum class VariableType : uint8_t {
    BOOL = 0x01,
    INT = 0x02,
    FLOAT = 0x03,
};

// Binary message header (8 bytes fixed)
#pragma pack(push, 1)
struct MessageHeader {
    MessageType type;           // 1 byte
    uint8_t reserved;           // 1 byte (padding)
    uint16_t count;             // 2 bytes: number of variables in batch
    uint32_t timestamp;         // 4 bytes: milliseconds since epoch
};
#pragma pack(pop)

// Variable entry (variable length)
struct VariableEntry {
    std::string name;           // [1 byte len] + [N bytes]
    VariableType type;          // 1 byte
    double value;               // 8 bytes (IEEE 754 double)
};

class BinaryEncoder {
public:
    // Encode batch of variables into binary format
    static std::vector<uint8_t> encodeBatch(
        const std::vector<VariableEntry>& entries,
        uint32_t timestamp
    );

    static VariableEntry makeEntry(
        const std::string& name,
        const std::string& typeStr,
        double value
    );
};

class BinaryDecoder {
public:
    // Parse binary message header
    static MessageHeader decodeHeader(const std::vector<uint8_t>& data);
};

} // namespace streaming
