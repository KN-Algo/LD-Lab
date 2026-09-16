#include "core/elements/Contact.h"

Contact::Contact(std::string a, ContactType t)
    : address(std::move(a)), type(t)
{
}

bool Contact::evaluate(bool powerFlow, MemoryMap& memory)
{
    return powerFlow && (type == ContactType::NO ? memory.getBool(address) : !memory.getBool(address)); // zwraca true jeśli przepływ jest możliwy i styk jest zgodny z jego typem (NO - musi być true, NC - musi być false)
}
