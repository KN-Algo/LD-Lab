#pragma once

#include "core/VirtualElement.h"

#include <string>

enum class ContactType : int
{
    NO,
    NC
};

class Contact : public VirtualElement
{
public:
    explicit Contact(std::string a, ContactType t); // jawny konstruktor przyjmujący typ styku - deklarować np. "Contact styk(NO);"
    bool evaluate(bool powerFlow, MemoryMap& memory) override;

private:
    std::string address; // zmienna oznaczajaca adres styku
    ContactType type; // zmienna oznaczajaca typ styku (NO lub NC) 
};