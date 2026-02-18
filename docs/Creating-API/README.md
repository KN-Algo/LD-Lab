# Jak dodać nowy moduł API

## 1. Utwórz header w folderze `include\<nazwa twojego modułu>` (np. `MyModule.h`)
```cpp
#pragma once
#include <saucer/smartview.hpp>

class MyModule {
public:
    // Definicja twoich funkcji
    static int calculate(int x);
    
    // Funkcja rejestrująca API (obowiązkowa!)
    static void registerApi(saucer::smartview* webview);
};
```

## 2. Utwórz implementację w folderze `src\api\<nazwa twojego modułu>`(np. `MyModule.cpp`)
```cpp
#include "api/<nazwa twojego modułu>/MyModule.h"
#include <print>

// implementacja twojej funkcji
int MyModule::calculate(int x) {
    return x * 2;
}

void MyModule::registerApi(saucer::smartview* webview) {
    std::println("Rejestrowanie: MyModule");
    
    webview->expose("my_function", [](int value) {
        std::println("my_function({})", value);
        return MyModule::calculate(value);
    });
}
```

## 3. Dodaj do `ApiRegistry.cpp`
```cpp
#include "api/<nazwa twojego modułu>/MyModule.h"

// W funkcji registerAll():
MyModule::registerApi(webview);
```

## Gotowe!

---

## Przykłady w folderze `src\api\example`:
- **Greeter** - prosty moduł zwracający tekst
- **Adder** - moduł z przeciążonymi funkcjami (2 liczby, wiele liczb)
