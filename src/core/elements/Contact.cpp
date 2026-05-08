#include "core/elements/Contact.h"

Contact::Contact(std::string a, ContactType t)
    : address(std::move(a)), type(t)
{

}

bool Contact::evaluate(bool powerFlow, MemoryMap& memory)
{
    return 0;
}
