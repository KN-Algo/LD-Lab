#pragma once 

#include <string>
#include <unordered_map>

class MemoryMap
{
public:
    bool getBool(const std::string& address) const;
    void setBool(const std::string& address, bool value);

private:
    std::unordered_map<std::string, bool> boolMemory;

};