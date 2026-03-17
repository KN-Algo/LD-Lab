# Jak dodać nowy moduł API

## Dokumentacja

- **[Variable Streaming - Poradnik Wykorzystania](./Variable-Streaming-Guide.md)** - Porady dotyczące implementacji zmiennych streamingowanych
- **[Variable Streaming - Techniczna informacja](./Variable-Streaming-Technical.md)** - Techniczne szczegóły implementacji zmiennych streamingowanych

---

## Backend (C++)

### 1. Utwórz header w folderze `include\<nazwa twojego modułu>` (np. `MyModule.h`)
```cpp
#pragma once
#include <saucer/smartview.hpp>

class MyModule {
public:
    // Definicja twoich funkcji
    static int calculate(int x);
    
    // Funkcja rejestrująca API (obowiązkowa!)
    static void registerApi(saucer::smartview& webview);
};
```

### 2. Utwórz implementację w folderze `src\api\<nazwa twojego modułu>`(np. `MyModule.cpp`)
```cpp
#include "api/<nazwa twojego modułu>/MyModule.h"
#include <print>

// implementacja twojej funkcji
int MyModule::calculate(int x) {
    return x * 2;
}

void MyModule::registerApi(saucer::smartview& webview) {
    std::println("Rejestrowanie: MyModule");
    
    webview.expose("my_function", [](int value) {
        std::println("my_function({})", value);
        return MyModule::calculate(value);
    });
}
```

### 3. Dodaj do `src/api/ApiRegistry.cpp`
```cpp
#include "api/<nazwa twojego modułu>/MyModule.h"

// W funkcji registerAll():
void registerAll(saucer::smartview& webview) {
    std::println("Rejestrowanie API dla Reacta...");
    
    MyModule::registerApi(webview);  //Dodaj tutaj
    
    std::println("API zarejestrowane pomyślnie!");
}
```

---

## Frontend (React/TypeScript)

Architektura frontu opiera się na wzorcach z [bulletproof-react](https://github.com/alan2207/bulletproof-react).

### Struktura folderów:
```
frontend/src/
├── lib/
│   └── api-client.ts              # Single instance API client
├── features/
│   └── cpp-api/
│       └── api/
│           ├── index.ts           # Barrel export dla łatwego importu
│           ├── use-greeter.ts     # Hook dla Greeter API
│           ├── use-add-numbers.ts # Hook dla Adder (2 liczby)
│           └── use-add-many.ts    # Hook dla Adder (wiele liczb)
└── App.tsx
```

### 1. Stwórz nowy hook w `frontend/src/features/cpp-api/api/use-my-function.ts`

```typescript
import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Hook do mojej funkcji
 * 
 * Usage:
 *   const { result, loading, error, call } = useMyFunction();
 *   await call(42);
 */
export const useMyFunction = () => {
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (value: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.call<number>("my_function", [value]);
      setResult(res);
      return res;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, call };
};
```

### 2. Eksportuj hook z `frontend/src/features/cpp-api/api/index.ts`

```typescript
export * from "./use-my-function";  // ← Dodaj tę linię
```

### 3. Użyj w komponencie

```tsx
import { useMyFunction } from "@/features/cpp-api/api";

function MyComponent() {
  const { result, loading, error, call } = useMyFunction();

  return (
    <div>
      <p>Wynik: {result}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => call(42)} disabled={loading}>
        {loading ? "Ładowanie..." : "Oblicz"}
      </button>
    </div>
  );
}
```

---

## Checklista dla nowego API

### Backend:
- [ ] Stworzony header (`include/api/modules/MyModule.h`)
- [ ] Stworzony plik implementacji (`src/api/modules/MyModule.cpp`)
- [ ] Metoda `registerApi()` implementuje expose funkcji
- [ ] Dodane do `ApiRegistry.cpp`

### Frontend:
- [ ] Stworzony hook (`use-my-function.ts`)
- [ ] Hook eksportowany z `features/cpp-api/api/index.ts`
- [ ] Hook używa `apiClient.call()`
- [ ] Hook zarządza stanem (loading, error, result)

---

## API Client Architecture

### [lib/api-client.ts](../../../frontend/src/lib/api-client.ts)
```typescript
class ApiClient {
  async call<T = unknown>(endpoint: string, args: unknown[]): Promise<T> {
    // Wywołuje funkcję C++ poprzez Saucer
    // Obsługuje błędy
    const result = await call<T>(endpoint, args);
    return result;
  }
}

export const apiClient = new ApiClient();
```

---

## Przykłady w folderze `src\api\modules`:
- **Greeter** - prosty moduł zwracający tekst
- **Adder** - moduł z przeciążonymi funkcjami (2 liczby, wiele liczb)

## Przykłady hookóww `frontend/src/features/cpp-api/api`:
- **useGreeter** - pobiera powitanie z C++
- **useAddNumbers** - dodaje dwie liczby
- **useAddMany** - sumuje tablicę liczb