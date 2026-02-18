#pragma once

#include <vector>
#include <saucer/smartview.hpp>

class Adder {
public:
    // Dodaje dwie liczby
    static double add(double a, double b);
    
    // Dodaje wiele liczb (przeciążenie)
    static double add(const std::vector<double>& numbers);
    
    // Rejestruje API tego modułu w webview
    static void registerApi(saucer::smartview& webview);
};

