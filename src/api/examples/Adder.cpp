#include "api/examples/Adder.h"
#include <numeric>
#include <print>

double Adder::add(double a, double b) {
    return a + b;
}

double Adder::add(const std::vector<double>& numbers) {
    return std::accumulate(numbers.begin(), numbers.end(), 0.0);
}

void Adder::registerApi(saucer::smartview& webview) {
    std::println("  📦 Rejestrowanie: Adder");
    
    webview.expose("add_numbers", [](double a, double b) {
        std::println("    ➕ add_numbers({}, {})", a, b);
        return Adder::add(a, b);
    });

    webview.expose("add_many", [](std::vector<double> numbers) {
        std::println("    ➕ add_many z {} liczbami", numbers.size());
        return Adder::add(numbers);
    });
}
