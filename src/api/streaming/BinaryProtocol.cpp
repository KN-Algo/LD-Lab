#include "api/streaming/BinaryProtocol.h"
#include <cstring>
#include <stdexcept>

namespace streaming {

// === ENCODER ===

std::vector<uint8_t> BinaryEncoder::encodeBatch(
    const std::vector<VariableEntry>& entries,
    uint32_t timestamp
) {
    // Calculate total size
    // Header: 8 bytes
    size_t totalSize = sizeof(MessageHeader);
    
    for (const auto& entry : entries) {
        // 1 byte name length + name bytes + 1 byte type + 8 bytes double
        totalSize += 1 + entry.name.length() + 1 + sizeof(double);
    }

    std::vector<uint8_t> buffer;
    buffer.reserve(totalSize);

    // Write header
    MessageHeader header;
    header.type = MessageType::BATCH_UPDATE;
    header.reserved = 0;
    header.count = static_cast<uint16_t>(entries.size());
    header.timestamp = timestamp;

    const uint8_t* headerPtr = reinterpret_cast<const uint8_t*>(&header);
    buffer.insert(buffer.end(), headerPtr, headerPtr + sizeof(MessageHeader));

    // Write entries
    for (const auto& entry : entries) {
        // Name length (1 byte)
        if (entry.name.length() > 255) {
            throw std::runtime_error("Variable name too long for binary protocol");
        }
        buffer.push_back(static_cast<uint8_t>(entry.name.length()));
        
        // Name bytes
        buffer.insert(buffer.end(), entry.name.begin(), entry.name.end());
        
        // Type (1 byte)
        buffer.push_back(static_cast<uint8_t>(entry.type));
        
        // Value (8 bytes double)
        const uint8_t* valuePtr = reinterpret_cast<const uint8_t*>(&entry.value);
        buffer.insert(buffer.end(), valuePtr, valuePtr + sizeof(double));
    }

    return buffer;
}

VariableEntry BinaryEncoder::makeEntry(
    const std::string& name,
    const std::string& typeStr,
    double value
) {
    VariableType type;
    if (typeStr == "BOOL") {
        type = VariableType::BOOL;
    } else if (typeStr == "INT") {
        type = VariableType::INT;
    } else if (typeStr == "FLOAT") {
        type = VariableType::FLOAT;
    } else {
        // Default fallback
        type = VariableType::FLOAT;
    }
    
    return VariableEntry{name, type, value};
}

// === DECODER (TypeScript side) ===
// See: frontend/src/lib/binary-protocol.ts

MessageHeader BinaryDecoder::decodeHeader(const std::vector<uint8_t>& data) {
    if (data.size() < sizeof(MessageHeader)) {
        throw std::runtime_error("Data too small for MessageHeader");
    }
    MessageHeader header;
    std::memcpy(&header, data.data(), sizeof(MessageHeader));
    return header;
}

} // namespace streaming
