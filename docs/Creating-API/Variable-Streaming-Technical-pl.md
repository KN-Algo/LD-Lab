# Streaming zmiennych - Implementacja techniczna

## Przegląd architektury

System Streaming Zmiennych zapewnia komunikację bidyrekcjonalną w czasie rzeczywistym między backendem C++ a frontendem React, wykorzystując architekturę opartą na push-notyfikacjach z niestandardowym protokołem binarnym (Base64).

### Kluczowe komponenty

#### Backend (C++)

1. **VariableTable** (`src/api/VariableTable.cpp`)
   - Singleton zarządzający wszystkimi zmiennymi (bezpieczny dla wątków)
   - Obsługuje trzy typy: BOOL, INT, FLOAT
   - Implementuje wzorzec obserwatora dla powiadomień o zmianach
   - Synchronizacja wątków poprzez `std::shared_mutex`

2. **BatchQueue** (`src/api/streaming/BatchQueue.cpp`)
   - Grupuje aktualizacje zmiennych w paczki (batching)
   - Wysyła paczki co określony czas (np. 16ms) lub po zebraniu określonej liczby zmiennych (np. 10)
   - Działa na osobnym wątku, aby nie blokować głównego wątku aplikacji

3. **DeltaTracker** (`src/api/streaming/DeltaTracker.cpp`)
   - Śledzi ostatnio wysłane wartości zmiennych
   - Filtruje wartości, które nie uległy zmianie (z uwzględnieniem epsilon `1e-9` dla typów zmiennoprzecinkowych)
   - Zapobiega wysyłaniu redundantnych danych do frontendu

4. **BinaryEncoder** (`src/api/streaming/BinaryProtocol.cpp`)
   - Serializuje paczki zmiennych do niestandardowego formatu binarnego
   - Minimalizuje narzut przesyłanych danych w porównaniu do JSON-a

5. **StreamingApi** (`src/api/streaming/StreamingApi.cpp`)
   - Udostępnia funkcje wywoływalne z JavaScriptu
   - Zarządza cyklem życia subskrypcji
   - Udostępnia operacje CRUD dla zmiennych

#### Frontend (React/TypeScript)

1. **BinaryDecoder** (`frontend/src/lib/binary-protocol.ts`)
   - Deserializuje dane binarne otrzymane z backendu
   - Konwertuje ciąg Base64 na `Uint8Array` i odczytuje wartości zgodnie z protokołem

2. **useVariablePush** (`frontend/src/features/cpp-api/api/use-variable-push.ts`)
   - Hook React dla aktualizacji zmiennych w czasie rzeczywistym
   - Nasłuchuje na globalną funkcję `window.binaryUpdate`
   - Dekoduje paczki binarne i grupuje aktualizacje stanu Reacta, aby zminimalizować liczbę renderowań

3. **useVariableControl** (`frontend/src/features/cpp-api/api/use-variable-control.ts`)
   - Hook do tworzenia i modyfikowania zmiennych
   - Obsługa błędów i stany ładowania

4. **subscriptionCache** (`frontend/src/lib/subscription-cache.ts`)
   - Globalny cache dla ID subskrypcji
   - Zapobiega duplikatowym subskrypcjom
   - Trwa przez ponowne montaże komponentów

## Przepływ komunikacji

### Architektura push-notyfikacji (Protokół Binarny)

```
Backend Thread               VariableTable              BatchQueue                 Frontend
     |                            |                         |                         |
     |-- update variable -------->|                         |                         |
     |                            |-- notifyFrontend() ---->|                         |
     |                            |   (DeltaTracker check)  |                         |
     |                            |                         |-- flush() ------------->|
     |                            |                         |   (encode binary)       |
     |                            |                         |   (base64 encode)       |
     |                            |                         |-- execute JS ---------->|
     |                            |                         |  window.binaryUpdate    |
     |                            |                         |                         |
     |                            |                         |                    decode base64
     |                            |                         |                    decode binary
     |                            |                         |                    update state
```

### Przepływ subskrypcji

```
Frontend                 Backend API              VariableTable
   |                          |                         |
   |-- subscribe("var") ----->|                         |
   |                          |-- subscribe() --------->|
   |                          |                    create observer
   |                          |<-- subscription ID --|  |
   |<-- subscription ID ------|                         |
   |                          |                         |
```

### Przepływ aktualizacji wartości

```
Frontend                Backend API            VariableTable
   |                         |                      |
   |-- setValue() --------->|                      |
   |   (immediate)          |                      |
   |                        |-- set() ------------>|
   |                        |              validate type
   |                        |              update value
   |                        |              notify observers
   |                        |              notifyFrontend()
   |                        |                      |
   |<-- binary push ------------------------------|
```

## Bezpieczeństwo wątków

### Synchronizacja VariableTable

- **Operacje odczytu**: Używają `std::shared_lock` (multiple readers allowed)
- **Operacje zapisu**: Używają `std::unique_lock` (exclusive access)
- **Wykonanie callback'ów**: Zachodzi w zakresie blokady dla spójności
- **Push notyfikacje**: Ograniczone dla każdej zmiennej, aby zapobiec warunkom wyścigów

### Synchronizacja BatchQueue

- **Kolejkowanie**: Używa `std::unique_lock` do dodawania zmiennych do kolejki
- **Wątek roboczy**: Używa `std::condition_variable_any` do oczekiwania na nowe zmienne lub upływ czasu
- **Wysyłanie**: Kopiuje zmienne z kolejki i zwalnia blokadę przed wywołaniem callbacka (aby nie blokować innych wątków)

### Strategia Mutex

```cpp
class VariableTable {
    mutable std::shared_mutex m_mutex;
    
    // Read: shared lock
    Variable get(const std::string& name) const {
        std::shared_lock lock(m_mutex);
        // ...
    }
    
    // Write: unique lock
    void set(const std::string& name, VariableValue value) {
        std::unique_lock lock(m_mutex);
        // ...
    }
};
```

## Optymalizacja wydajności

### Mechanizmy ograniczania

#### Ograniczanie na backencie (Batching)
- Limit szybkości: 16ms na paczkę (około 60 aktualizacji/sekundę)
- Limit rozmiaru: 10 zmiennych na paczkę
- Implementacja: `BatchQueue` z osobnym wątkiem roboczym
- Cel: Zapobieganie powodzią wykonania JavaScriptu i minimalizacja narzutu komunikacji

```cpp
batchQueue.configure(
    10,                                    // max 10 variables per batch
    std::chrono::milliseconds(16)         // or every 16ms
);
```

#### Debouncing na froncie (Usunięty)
- Wcześniej stosowano opóźnienie 100ms dla operacji `setValue`
- Zostało to usunięte w Fazie 3, ponieważ protokół binarny jest wystarczająco wydajny, aby obsłużyć natychmiastowe aktualizacje (np. z suwaka)

### Detekcja zmian wartości (Delta Tracking)

Backend wyzwala notyfikacje tylko gdy wartość faktycznie się zmieni:

```cpp
auto& tracker = streaming::DeltaTracker::getInstance();
if (!tracker.hasChanged(var.name, value)) {
    return; // Skip if value hasn't changed significantly
}
tracker.recordSent(var.name, value);
```

Frontend dokonuje podobnego porównania przed aktualizacją stanu:

```typescript
setVariables((prev) => {
    if (prev[name]?.value === newValue) {
        return prev;  // No re-render
    }
    return { ...prev, [name]: newValue };
});
```

## Zarządzanie pamięcią

### Cykl życia subskrypcji

1. **Utworzenie**: ID subskrypcji przypisane inkrementalnie
2. **Magazynowanie**: Przechowywane w globalnym cache'u (frontend) i mapie (backend)
3. **Czyszczenie**: Wymagane ręczne unsubscribe
4. **Trwałość**: ID cachowane globalnie, ponownie wykorzystywane przy ponownym montażu

### Magazynowanie zmiennych

- Zmienne przechowywane w `std::map<std::string, Variable>`
- Typ wartości: `std::variant<bool, int, float>`
- Rozmiar pamięci: Około 64 bajtów na zmienną
- Brak automatycznego czyszczenia (wymagane ręczne usunięcie)

## Integracja WebView

### Wykonanie JavaScriptu

System używa metody `execute()` Saucera do push'owania notyfikacji:

```cpp
void VariableTable::notifyFrontend(const Variable& var) {
    auto* webview = static_cast<saucer::smartview*>(m_webview);
    
    webview->execute(
        "if (window.onVariableChange) {{ window.onVariableChange({}, {}, {}); }}",
        var.name, typeStr, jsValue
    );
}
```

### Rejestracja globalnego callback'u

Frontend rejestruje globalny handler raz:

```typescript
if (!window.onVariableChange) {
    window.onVariableChange = (name: string, type: string, value: number) => {
        const listeners = window.__variableChangeListeners?.get(name);
        listeners?.forEach(listener => listener({ name, type, value }));
    };
}
```

## System typów

### Typy zmiennych

| Typ | Typ C++ | Typ JavaScript | Zakres |
|-----|---------|---|---|
| BOOL | `bool` | `number` | 0 lub 1 |
| INT | `int` | `number` | -2147483648 do 2147483647 |
| FLOAT | `float` | `number` | Pojedyncza precyzja IEEE 754 |

### Konwersja typów

#### Backend do Frontend
```cpp
double jsValue = 0.0;
if (std::holds_alternative<bool>(var.value)) {
    jsValue = std::get<bool>(var.value) ? 1.0 : 0.0;
} else if (std::holds_alternative<int>(var.value)) {
    jsValue = static_cast<double>(std::get<int>(var.value));
}
```

#### Frontend do Backend
```cpp
if (type == VariableType::INT) {
    table.set(varName, type, static_cast<int>(value));
} else if (type == VariableType::FLOAT) {
    table.set(varName, type, static_cast<float>(value));
}
```

## Obsługa błędów

### Strategia błędów na backencie

- Niezgodność typów: Rzuć `std::runtime_error`
- Zmienna nie znaleziona: Rzuć `std::runtime_error`
- Wyjątki callback'ów: Wyłapane i zarejestrowane, nie propagują się
- Niepowodzenia push notyfikacji: Zalogowane do stderr, wykonanie trwa

### Strategia błędów na froncie

- Niepowodzenia wywołań API: Wyłapane w try-catch, przechowywane w stanie błędu
- Błędy typu: Sprawdzanie czasu kompilacji TypeScript
- Błędy sieci: Propagowane do wywołującego poprzez rzucony wyjątek
- Nieprawidłowe ID subskrypcji: Zalogowane do konsoli, operacja pominięta

## Charakterystyka opóźnień

### Push-Based (obecny)
- Średnie opóźnienie: < 20ms
- Rozkład opóźnienia:
  - Detencja backendu: < 1ms
  - Wykonanie JavaScriptu: 5-10ms
  - Aktualizacja stanu React: 5-10ms
- Wąskie gardło: Potok renderowania React

### Polling-Based (poprzedni)
- Średnie opóźnienie: 250ms (interwał 500ms)
- Najgorszy scenariusz: 500ms
- Stały narzut CPU

## Rozważania dotyczące skalowania

### Obecne limity
- Маksymalna liczba zmiennych: Ograniczona dostępną pamięcią
- Maksymalnych subskrybentów na zmienną: Nieograniczone (magazynowanie oparte na mapie)
- Szybkość push notyfikacji: 60/sekunda na zmienną
- Równoczesne odczyty: Nieograniczone (shared_mutex)

### Potencjalne wąskie gardła
1. Częstotliwość wykonania JavaScriptu (zmniejszone przez ograniczanie)
2. Narzut re-renderowania React (zmniejszone przez memoizację)
3. Konkurencja mutex'ów przy wysokim obciążeniu pisania
4. Wydajność wyszukiwania mapy z > 10,000 zmiennymi

## Przyszłe ulepszenia

### Rozważania fazy 4
- Warstwa transportu WebSocket (jeśli Base64 okaże się niewystarczający)
- Odporność na połączenie i logika ponownego połączenia
- Filtrowanie i agregacja po stronie serwera
- Dynamiczne dostosowywanie parametrów batchingu w zależności od obciążenia

## Zależności

### Backend
- Standard biblioteki C++23
- Biblioteka WebView Saucer
- Biblioteka b64 (do kodowania Base64)
- `<print>` dla rejestrowania
- `<chrono>` dla timingu
- `<shared_mutex>` dla synchronizacji

### Frontend
- React 18+
- TypeScript 5+
- Brak zewnętrznych zależności dla logiki streamingu
