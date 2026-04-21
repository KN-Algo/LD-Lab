#pragma once 

class MemoryMap;

class VirtualElement
{
public:
    virtual ~VirtualElement() = default;
    virtual bool evaluate(bool powerFlow, MemoryMap& memory) = 0;
};