#pragma once

#include <string>
#include <saucer/smartview.hpp>

class Greeter {
public:
    // Zwraca pozdrowienie
    static std::string hello();
    
    // Rejestruje API tego modułu w webview
    static void registerApi(saucer::smartview& webview);
};
