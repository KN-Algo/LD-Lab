#include "api/examples/Greeter.h"
#include <print>

std::string Greeter::hello() {
    return "Pozdrowienia z C++ (Modern Syntax)!";
}

void Greeter::registerApi(saucer::smartview& webview) {
    std::println("  📦 Rejestrowanie: Greeter");
    
    webview.expose("hello_from_cpp", []() {
        std::println("    👋 hello_from_cpp()");
        return Greeter::hello();
    });
}
