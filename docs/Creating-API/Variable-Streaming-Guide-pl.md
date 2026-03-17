# Streaming zmiennych - Dla Deweloperów

## Wprowadzenie

System Streaming Zmiennych umożliwia synchronizację danych w czasie rzeczywistym między backendem C++ a frontendem React. Zmienne są automatycznie push'owane do frontendu gdy się zmieniają, wykorzystując niestandardowy protokół binarny (Base64) z grupowaniem (batching) i śledzeniem zmian (delta tracking). Eliminując potrzebę polling'u i narzut JSON-a, system ten jest gotowy na bardzo wysoką częstotliwość aktualizacji.

## Szybki start

### Tworzenie zmiennej (Backend)

Plik odpowiedzialny za tworzenie zmiennych można znaleźć tutaj: `src\api\VariableInitializer.cpp`

```cpp
#include "api/VariableTable.h"

// Pobierz instancję singleton'a
auto& table = VariableTable::getInstance();

// Utwórz nową zmienną
table.create("myCounter", VariableType::INT, 0);
table.create("isEnabled", VariableType::BOOL, true);
table.create("temperature", VariableType::FLOAT, 25.5f);
```

### Odczytywanie zmiennej (Frontend)

```tsx
import { useVariablePush } from "@/features/cpp-api/api";

function MyComponent() {
  const { variables } = useVariablePush(["myCounter", "isEnabled"]);
  
  const counter = variables.myCounter?.value ?? 0;
  const enabled = variables.isEnabled?.value !== 0;
  
  return (
    <div>
      <p>Counter: {counter}</p>
      <p>Enabled: {enabled ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Aktualizowanie zmiennej (Frontend)

```tsx
import { useVariableControl } from "@/features/cpp-api/api";

function ControlPanel() {
  const { setValue } = useVariableControl();
  
  const increment = async () => {
    await setValue("myCounter", "INT", 42);
  };
  
  return <button onClick={increment}>Set to 42</button>;
}
```

## Backend API

### Metody VariableTable

#### `create(name, type, value)`
Tworzy nową zmienną.

**Parametry:**
- `name` (string): Unikalny identyfikator zmiennej
- `type` (VariableType): BOOL, INT, lub FLOAT
- `value` (VariableValue): Wartość początkowa zgodna z typem

**Przykład:**
```cpp
table.create("speed", VariableType::FLOAT, 60.0f);
```

**Wyrzuca:** `std::runtime_error` jeśli zmienna już istnieje lub niezgodność typu

---

#### `set(name, type, value)`
Aktualizuje istniejącą wartość zmiennej.

**Parametry:**
- `name` (string): Identyfikator zmiennej
- `type` (VariableType): Musi pasować do oryginalnego typu zmiennej
- `value` (VariableValue): Nowa wartość

**Przykład:**
```cpp
table.set("speed", VariableType::FLOAT, 75.5f);
```

**Uwaga:** Wyzwala callback'i tylko jeśli wartość faktycznie się zmieniła.

---

#### `get(name)`
Pobiera obecną wartość zmiennej.

**Parametry:**
- `name` (string): Identyfikator zmiennej

**Zwraca:** Struktura `Variable` zawierająca nazwę, typ i wartość

**Przykład:**
```cpp
Variable var = table.get("speed");
float speed = std::get<float>(var.value);
```

**Wyrzuca:** `std::runtime_error` jeśli zmienna nie znaleziona

---

#### `exists(name)`
Sprawdza czy zmienna istnieje.

**Parametry:**
- `name` (string): Identyfikator zmiennej

**Zwraca:** `bool`

**Przykład:**
```cpp
if (table.exists("speed")) {
    // Zmienna istnieje
}
```

---

#### `remove(name)`
Usuwa zmienną i wszystkie jej subskrypcje.

**Parametry:**
- `name` (string): Identyfikator zmiennej

**Przykład:**
```cpp
table.remove("speed");
```

**Uwaga:** Subskrypcje frontendu nie będą otrzymywać dalszych aktualizacji.

---

#### `subscribe(varName, callback)`
Rejestruje callback dla zmian zmiennej.

**Parametry:**
- `varName` (string): Zmienna do obserwowania
- `callback` (VariableChangeCallback): Funkcja wywoływana przy zmianie

**Zwraca:** ID subskrypcji (int)

**Przykład:**
```cpp
int subId = table.subscribe("speed", [](const Variable& var) {
    std::println("Speed changed to: {}", std::get<float>(var.value));
});
```

---

#### `unsubscribe(subscriptionId)`
Usuwa subskrypcję callback'u.

**Parametry:**
- `subscriptionId` (int): ID zwrócone przez subscribe()

**Przykład:**
```cpp
table.unsubscribe(subId);
```

## Frontend API

### Hook useVariablePush

Hook czasu rzeczywistego dla monitorowania zmiennych z push notyfikacjami.

**Sygnatura:**
```typescript
function useVariablePush(
  varNames: string[]
): {
  variables: Record<string, VariableData>;
  loading: boolean;
  error: string | null;
  subscribe: (varName: string) => Promise<void>;
  unsubscribe: (varName: string) => Promise<void>;
}
```

**Parametry:**
- `varNames`: Tablica nazw zmiennych do monitorowania

**Zwraca:**
- `variables`: Obiekt mapujący nazwy zmiennych na ich dane
- `loading`: Prawda podczas początkowej subskrypcji
- `error`: Komunikat błędu jeśli operacja się nie powiodła
- `subscribe`: Funkcja dodająca nową zmienną
- `unsubscribe`: Funkcja usuwająca zmienną

**Przykład:**
```tsx
const { variables, loading, error } = useVariablePush([
  "counter",
  "temperature",
  "isActive"
]);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

const counter = variables.counter?.value ?? 0;
```

**Uwaga:** Zmienne są automatycznie subskrybowane przy montażu i odsubskrybowane przy demontażu.

---

### Hook useVariableControl

Hook do tworzenia i modyfikowania zmiennych.

**Sygnatura:**
```typescript
function useVariableControl(): {
  createVariable: (
    name: string,
    type: "BOOL" | "INT" | "FLOAT",
    initialValue: number
  ) => Promise<boolean>;
  setValue: (
    name: string,
    type: "BOOL" | "INT" | "FLOAT",
    value: number
  ) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}
```

**Zwraca:**
- `createVariable`: Tworzy nową zmienną backendu
- `setValue`: Aktualizuje istniejącą zmienną (debounced)
- `loading`: Prawda podczas operacji API
- `error`: Komunikat błędu jeśli operacja się nie powiodła

**Przykład:**
```tsx
const { createVariable, setValue, loading } = useVariableControl();

const handleCreate = async () => {
  const success = await createVariable("myVar", "INT", 100);
  if (success) {
    console.log("Variable created");
  }
};

const handleUpdate = async () => {
  await setValue("myVar", "INT", 200);
};
```

**Uwaga:** `setValue` zawiera 100ms debounce aby zapobiec powodzi podczas szybkich aktualizacji.

---

### Interfejs VariableData

```typescript
interface VariableData {
  name: string;
  type: "BOOL" | "INT" | "FLOAT";
  value: number;
}
```

**Konwersje typów:**
- `BOOL`: 0 = false, wartość niezerowa = true
- `INT`: Liczby całkowite
- `FLOAT`: Liczby dziesiętne

## Popularne wzorce

### Wzorzec 1: Monitorowana zmienna

Wyświetl zmienną kontrolowaną przez backend, która aktualizuje się automatycznie.

```tsx
function TemperatureDisplay() {
  const { variables } = useVariablePush(["temperature"]);
  const temp = variables.temperature?.value ?? 0;
  
  return <div>Temperature: {temp.toFixed(1)}°C</div>;
}
```

---

### Wzorzec 2: Kontrolowana zmienna

Użytkownik kontroluje zmienną z natychmiastową wizualną sprzężeniem zwrotnym.

```tsx
function VolumeSlider() {
  const { variables } = useVariablePush(["volume"]);
  const { setValue } = useVariableControl();
  const [localValue, setLocalValue] = useState<number | null>(null);
  
  const volume = localValue ?? variables.volume?.value ?? 50;
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue); // Optimistic update
    
    // Debounced backend update
    setTimeout(() => {
      setValue("volume", "FLOAT", newValue);
      setLocalValue(null);
    }, 100);
  };
  
  return (
    <input 
      type="range" 
      min="0" 
      max="100" 
      value={volume}
      onChange={handleChange}
    />
  );
}
```

**Uwaga:** Optymistyczny UI (localValue) zapewnia natychmiastowe sprzężenie zwrotne podczas synchronizacji backendu.

---

### Wzorzec 3: Dynamiczne tworzenie zmiennej

Zezwól użytkownikom na tworzenie zmiennych w czasie wykonania.

```tsx
function VariableCreator() {
  const { createVariable } = useVariableControl();
  const { subscribe } = useVariablePush([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"BOOL" | "INT" | "FLOAT">("INT");
  const [value, setValue] = useState(0);
  
  const handleCreate = async () => {
    const success = await createVariable(name, type, value);
    if (success) {
      await subscribe(name);
      setName("");
    }
  };
  
  return (
    <form onSubmit={handleCreate}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <select value={type} onChange={e => setType(e.target.value as any)}>
        <option value="BOOL">Boolean</option>
        <option value="INT">Integer</option>
        <option value="FLOAT">Float</option>
      </select>
      <input 
        type="number" 
        value={value} 
        onChange={e => setValue(parseFloat(e.target.value))} 
      />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

### Wzorzec 4: Monitorowanie warunkowe

Subskrybuj zmienne na podstawie warunków.

```tsx
function ConditionalMonitor({ mode }: { mode: string }) {
  const varNames = mode === "basic" 
    ? ["counter"] 
    : ["counter", "temperature", "pressure"];
    
  const { variables } = useVariablePush(varNames);
  
  return (
    <div>
      {Object.entries(variables).map(([name, data]) => (
        <div key={name}>{name}: {data.value}</div>
      ))}
    </div>
  );
}
```

**Uwaga:** Zmiana `varNames` automatycznie aktualizuje subskrypcje.

## Inicjalizowanie zmiennych przy starcie

### Używanie VariableInitializer

Utwórz usługę inicjalizacji w `src/api/VariableInitializer.cpp`:

```cpp
#include "api/VariableInitializer.h"
#include "api/VariableTable.h"

void VariableInitializer::initialize() {
    auto& table = VariableTable::getInstance();
    
    // Utwórz zmienne aplikacji
    table.create("appVersion", VariableType::FLOAT, 1.0f);
    table.create("debugMode", VariableType::BOOL, false);
    table.create("userCount", VariableType::INT, 0);
    
    std::println("[VariableInitializer] Variables initialized");
}
```

Wywołaj z `main.cpp`:

```cpp
#include "api/VariableInitializer.h"

coco::stray start(saucer::application *app) {
    VariableInitializer::initialize();
    // ... reszta inicjalizacji
}
```

## Aktualizacje w tle

### Używanie VariableUpdater

Utwórz usługę aktualizacji w `src/api/VariableUpdater.cpp`:

```cpp
#include "api/VariableUpdater.h"
#include "api/VariableTable.h"
#include <thread>

static std::atomic<bool> running{false};
static std::thread updaterThread;

void VariableUpdater::start() {
    running = true;
    
    updaterThread = std::thread([]() {
        auto& table = VariableTable::getInstance();
        int counter = 0;
        
        while (running) {
            // Aktualizuj counter
            counter = (counter + 1) % 100;
            table.set("counter", VariableType::INT, counter);
            
            // Aktualizuj timestamp
            auto now = std::chrono::system_clock::now();
            auto timestamp = std::chrono::duration<float>(
                now.time_since_epoch()
            ).count();
            table.set("timestamp", VariableType::FLOAT, timestamp);
            
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    });
}

void VariableUpdater::stop() {
    running = false;
    if (updaterThread.joinable()) {
        updaterThread.join();
    }
}
```

**Uwaga:** Aktualizacje automatycznie push'ują do wszystkich subskrybowanych komponentów frontendu.

## Najlepsze praktyki wydajności

### Backend

1. **Batch're powiązane aktualizacje**: Zgrupuj logicznie powiązane aktualizacje zmiennych
2. **Unikaj niepotrzebnych setów**: Sprawdź czy wartość się zmieniła przed wywołaniem `set()`
3. **Użyj odpowiednich typów**: INT dla liczników, FLOAT dla pomiarów
4. **Ogranicz złożoność callback'ów**: Utrzymuj callback'i subskrypcji lekkie
5. **Rozważ częstotliwość aktualizacji**: Ogranicz aktualizacje o wysokiej częstotliwości

### Frontend

1. **Użyj memoizacji**: Zawiń komponenty w `React.memo`
2. **Implementuj debouncing**: Debounce'uj wejście użytkownika przed setValue
3. **Optymistyczne aktualizacje**: Aktualizuj UI natychmiast, synchronizuj z backendem później
4. **Selektywne subskrypcje**: Subskrybuj tylko potrzebne zmienne
5. **Czyszczenie przy demontażu**: Hook'i obsługują to automatycznie

### Przykład: Zoptymalizowany komponent

```tsx
const VariableCard = React.memo(({ varName }: { varName: string }) => {
  const { variables } = useVariablePush([varName]);
  const value = variables[varName]?.value ?? 0;
  
  return <div>{varName}: {value}</div>;
});

VariableCard.displayName = "VariableCard";
```

## Rozwiązywanie problemów

### Zmienna się nie aktualizuje na froncie

**Możliwe przyczyny:**
1. Zmienna nie jest subskrybowana (sprawdź tablicę `useVariablePush`)
2. Backend nie wywołuje `set()` (sprawdź logi C++)
3. Niezgodność typów (zweryfikuj typ pasuje między create i set)
4. Ograniczanie aktywne (czekaj 16ms między aktualizacjami)

**Rozwiązanie:**
```tsx
// Zweryfikuj subskrypcję
const { variables, error } = useVariablePush(["myVar"]);
console.log("Subscribed variables:", Object.keys(variables));
console.log("Error:", error);
```

---

### Błąd "Variable not found"

**Przyczyna:** Próba pobrania/ustalenia zmiennej, która nie istnieje

**Rozwiązanie:**
```cpp
// Zawsze sprawdź istnienie najpierw
if (!table.exists("myVar")) {
    table.create("myVar", VariableType::INT, 0);
}
table.set("myVar", VariableType::INT, 42);
```

---

### Aplikacja się zawiesza podczas aktualizacji

**Przyczyna:** Zbyt wiele aktualizacji bez ograniczania

**Rozwiązanie:**
```tsx
// Dodaj debouncing
const debouncedSetValue = useDebouncedCallback(
  (value: number) => setValue("myVar", "FLOAT", value),
  100
);

// Użyj w onChange
<input onChange={e => debouncedSetValue(parseFloat(e.target.value))} />
```

---

### Błędy niezgodności typów

**Przyczyna:** Ustawienie wartości INT na zmiennej FLOAT (lub vice versa)

**Rozwiązanie:**
```cpp
// Zawsze używaj spójnych typów
Variable var = table.get("myVar");

if (var.type == VariableType::INT) {
    table.set("myVar", VariableType::INT, 42);
} else if (var.type == VariableType::FLOAT) {
    table.set("myVar", VariableType::FLOAT, 42.0f);
}
```

## Podsumowanie API Reference

### Backend Functions (C++)

| Funkcja | Cel | Bezpieczna dla wątków |
|---------|-----|---|
| `create()` | Tworzy nową zmienną | Tak |
| `set()` | Aktualizuj wartość zmiennej | Tak |
| `get()` | Pobierz zmienną | Tak |
| `exists()` | Sprawdź istnienie | Tak |
| `remove()` | Usuń zmienną | Tak |
| `subscribe()` | Rejestruj callback | Tak |
| `unsubscribe()` | Usuń callback | Tak |

### Frontend Hooks (React)

| Hook | Cel | Auto-Cleanup |
|------|-----|---|
| `useVariablePush` | Monitoruj zmienne | Tak |
| `useVariableControl` | Twórz/aktualizuj zmienne | N/A |

### StreamingApi Functions (callable z JavaScriptu)

| Funkcja | Parametry | Typ zwracany |
|---------|-----------|---|
| `subscribe_variable` | varName: string | number (subscription ID) |
| `unsubscribe_variable` | subscriptionId: number | void |
| `get_variable` | varName: string | VariableResponse |
| `get_all_variables` | none | AllVariablesResponse |
| `set_variable` | varName, type, value | boolean |
| `create_variable` | varName, type, initialValue | boolean |

## Dodatkowe zasoby

- Szczegóły implementacji technicznej: `Variable-Streaming-Technical.md`
- Poradnik tworzenia API: `README.md`
- Przykłady użycia: `frontend/src/features/cpp-api/examples/`
  - `VariableMonitor.tsx` - Siatka wyświetlająca zmienne
  - `CircleDemo.tsx` - Przykład bidyrekcjonalnej kontroli
