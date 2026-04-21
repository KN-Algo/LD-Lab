#include "core/engine/MemoryMap.h"

bool MemoryMap::getBool(const std::string& address) const {
    auto it = boolMemory.find(address);

    if (it != boolMemory.end()) {
        return it->second;
    }

    //default jeśli nie istnieje
    return false;
}

void MemoryMap::setBool(const std::string& address, bool value) {
    boolMemory[address] = value;
}