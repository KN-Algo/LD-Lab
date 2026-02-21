# Variable Streaming - Developer Guide

## Introduction

The Variable Streaming system enables real-time data synchronization between C++ backend and React frontend. Variables are automatically pushed to the frontend when they change, eliminating the need for polling.

## Quick Start

### Creating a Variable (Backend)

File responsible for creating variables can be found here: `src\api\VariableInitializer.cpp`

```cpp
#include "api/VariableTable.h"

// Get singleton instance
auto& table = VariableTable::getInstance();

// Create a new variable
table.create("myCounter", VariableType::INT, 0);
table.create("isEnabled", VariableType::BOOL, true);
table.create("temperature", VariableType::FLOAT, 25.5f);
```

### Reading a Variable (Frontend)

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

### Updating a Variable (Frontend)

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

### VariableTable Methods

#### `create(name, type, value)`
Creates a new variable.

**Parameters:**
- `name` (string): Unique variable identifier
- `type` (VariableType): BOOL, INT, or FLOAT
- `value` (VariableValue): Initial value matching the type

**Example:**
```cpp
table.create("speed", VariableType::FLOAT, 60.0f);
```

**Throws:** `std::runtime_error` if variable already exists or type mismatch

---

#### `set(name, type, value)`
Updates an existing variable value.

**Parameters:**
- `name` (string): Variable identifier
- `type` (VariableType): Must match variable's original type
- `value` (VariableValue): New value

**Example:**
```cpp
table.set("speed", VariableType::FLOAT, 75.5f);
```

**Note:** Only triggers callbacks if value actually changed.

---

#### `get(name)`
Retrieves current variable value.

**Parameters:**
- `name` (string): Variable identifier

**Returns:** `Variable` struct containing name, type, and value

**Example:**
```cpp
Variable var = table.get("speed");
float speed = std::get<float>(var.value);
```

**Throws:** `std::runtime_error` if variable not found

---

#### `exists(name)`
Checks if variable exists.

**Parameters:**
- `name` (string): Variable identifier

**Returns:** `bool`

**Example:**
```cpp
if (table.exists("speed")) {
    // Variable exists
}
```

---

#### `remove(name)`
Deletes a variable and all its subscriptions.

**Parameters:**
- `name` (string): Variable identifier

**Example:**
```cpp
table.remove("speed");
```

**Note:** Frontend subscriptions will receive no further updates.

---

#### `subscribe(varName, callback)`
Registers a callback for variable changes.

**Parameters:**
- `varName` (string): Variable to observe
- `callback` (VariableChangeCallback): Function called on change

**Returns:** Subscription ID (int)

**Example:**
```cpp
int subId = table.subscribe("speed", [](const Variable& var) {
    std::println("Speed changed to: {}", std::get<float>(var.value));
});
```

---

#### `unsubscribe(subscriptionId)`
Removes a callback subscription.

**Parameters:**
- `subscriptionId` (int): ID returned by subscribe()

**Example:**
```cpp
table.unsubscribe(subId);
```

## Frontend API

### useVariablePush Hook

Real-time hook for monitoring variables with push notifications.

**Signature:**
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

**Parameters:**
- `varNames`: Array of variable names to monitor

**Returns:**
- `variables`: Object mapping variable names to their data
- `loading`: True during initial subscription
- `error`: Error message if operation failed
- `subscribe`: Function to add a new variable
- `unsubscribe`: Function to remove a variable

**Example:**
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

**Note:** Variables are automatically subscribed on mount and unsubscribed on unmount.

---

### useVariableControl Hook

Hook for creating and modifying variables.

**Signature:**
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

**Returns:**
- `createVariable`: Creates a new backend variable
- `setValue`: Updates existing variable (debounced)
- `loading`: True during API operation
- `error`: Error message if operation failed

**Example:**
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

**Note:** `setValue` includes 100ms debounce to prevent flooding during rapid updates.

---

### VariableData Interface

```typescript
interface VariableData {
  name: string;
  type: "BOOL" | "INT" | "FLOAT";
  value: number;
}
```

**Type Conversions:**
- `BOOL`: 0 = false, non-zero = true
- `INT`: Whole numbers
- `FLOAT`: Decimal numbers

## Common Patterns

### Pattern 1: Monitored Variable

Display a backend-controlled variable that updates automatically.

```tsx
function TemperatureDisplay() {
  const { variables } = useVariablePush(["temperature"]);
  const temp = variables.temperature?.value ?? 0;
  
  return <div>Temperature: {temp.toFixed(1)}°C</div>;
}
```

---

### Pattern 2: Controlled Variable

User controls a variable with immediate visual feedback.

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

**Note:** Optimistic UI (localValue) provides instant feedback while backend syncs.

---

### Pattern 3: Dynamic Variable Creation

Allow users to create variables at runtime.

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

### Pattern 4: Conditional Monitoring

Subscribe to variables based on conditions.

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

**Note:** Changing `varNames` automatically updates subscriptions.

## Initializing Variables on Startup

### Using VariableInitializer

Create initialization service in `src/api/VariableInitializer.cpp`:

```cpp
#include "api/VariableInitializer.h"
#include "api/VariableTable.h"

void VariableInitializer::initialize() {
    auto& table = VariableTable::getInstance();
    
    // Create application variables
    table.create("appVersion", VariableType::FLOAT, 1.0f);
    table.create("debugMode", VariableType::BOOL, false);
    table.create("userCount", VariableType::INT, 0);
    
    std::println("[VariableInitializer] Variables initialized");
}
```

Call from `main.cpp`:

```cpp
#include "api/VariableInitializer.h"

coco::stray start(saucer::application *app) {
    VariableInitializer::initialize();
    // ... rest of initialization
}
```

## Background Updates

### Using VariableUpdater

Create update service in `src/api/VariableUpdater.cpp`:

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
            // Update counter
            counter = (counter + 1) % 100;
            table.set("counter", VariableType::INT, counter);
            
            // Update timestamp
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

**Note:** Updates automatically push to all subscribed frontend components.

## Performance Best Practices

### Backend

1. **Batch related updates**: Group logically related variable updates
2. **Avoid unnecessary sets**: Check if value changed before calling `set()`
3. **Use appropriate types**: INT for counters, FLOAT for measurements
4. **Limit callback complexity**: Keep subscription callbacks lightweight
5. **Consider update frequency**: Throttle high-frequency updates

### Frontend

1. **Use memoization**: Wrap components in `React.memo`
2. **Implement debouncing**: Debounce user input before setValue
3. **Optimistic updates**: Update UI immediately, sync with backend later
4. **Selective subscriptions**: Only subscribe to needed variables
5. **Cleanup on unmount**: Hooks handle this automatically

### Example: Optimized Component

```tsx
const VariableCard = React.memo(({ varName }: { varName: string }) => {
  const { variables } = useVariablePush([varName]);
  const value = variables[varName]?.value ?? 0;
  
  return <div>{varName}: {value}</div>;
});

VariableCard.displayName = "VariableCard";
```

## Troubleshooting

### Variable not updating on frontend

**Possible causes:**
1. Variable not subscribed (check `useVariablePush` array)
2. Backend not calling `set()` (check C++ logs)
3. Type mismatch (verify type matches between create and set)
4. Throttling active (wait 16ms between updates)

**Solution:**
```tsx
// Verify subscription
const { variables, error } = useVariablePush(["myVar"]);
console.log("Subscribed variables:", Object.keys(variables));
console.log("Error:", error);
```

---

### "Variable not found" error

**Cause:** Attempting to get/set a non-existent variable

**Solution:**
```cpp
// Always check existence first
if (!table.exists("myVar")) {
    table.create("myVar", VariableType::INT, 0);
}
table.set("myVar", VariableType::INT, 42);
```

---

### Application freezing during updates

**Cause:** Too many updates without throttling

**Solution:**
```tsx
// Add debouncing
const debouncedSetValue = useDebouncedCallback(
  (value: number) => setValue("myVar", "FLOAT", value),
  100
);

// Use in onChange
<input onChange={e => debouncedSetValue(parseFloat(e.target.value))} />
```

---

### Type mismatch errors

**Cause:** Setting INT value on FLOAT variable (or vice versa)

**Solution:**
```cpp
// Always use consistent types
Variable var = table.get("myVar");

if (var.type == VariableType::INT) {
    table.set("myVar", VariableType::INT, 42);
} else if (var.type == VariableType::FLOAT) {
    table.set("myVar", VariableType::FLOAT, 42.0f);
}
```

## Testing

### Backend Unit Test Example

```cpp
TEST_CASE("Variable creation and retrieval") {
    auto& table = VariableTable::getInstance();
    table.clear();
    
    table.create("test", VariableType::INT, 42);
    Variable var = table.get("test");
    
    REQUIRE(var.name == "test");
    REQUIRE(var.type == VariableType::INT);
    REQUIRE(std::get<int>(var.value) == 42);
}
```

### Frontend Hook Test Example

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useVariablePush } from "./use-variable-push";

test("receives variable updates", async () => {
  const { result } = renderHook(() => useVariablePush(["testVar"]));
  
  await waitFor(() => {
    expect(result.current.variables.testVar).toBeDefined();
  });
  
  expect(result.current.variables.testVar.value).toBe(0);
});
```

## Migration from Polling

If migrating from the old polling-based system:

### Before (useVariableSubscription)
```tsx
const { variables, pollInterval } = useVariableSubscription(
  ["counter"], 
  500 // Poll every 500ms
);
```

### After (useVariablePush)
```tsx
const { variables } = useVariablePush(["counter"]);
// No polling interval needed - push-based
```

**Benefits:**
- Lower latency (< 20ms vs 250ms average)
- Reduced CPU usage (event-driven vs constant polling)
- No missed updates between poll intervals

## API Reference Summary

### Backend Functions (C++)

| Function | Purpose | Thread-Safe |
|----------|---------|-------------|
| `create()` | Create new variable | Yes |
| `set()` | Update variable value | Yes |
| `get()` | Retrieve variable | Yes |
| `exists()` | Check existence | Yes |
| `remove()` | Delete variable | Yes |
| `subscribe()` | Register callback | Yes |
| `unsubscribe()` | Remove callback | Yes |

### Frontend Hooks (React)

| Hook | Purpose | Auto-Cleanup |
|------|---------|--------------|
| `useVariablePush` | Monitor variables | Yes |
| `useVariableControl` | Create/update variables | N/A |

### StreamingApi Functions (JavaScript-callable)

| Function | Parameters | Return Type |
|----------|-----------|-------------|
| `subscribe_variable` | varName: string | number (subscription ID) |
| `unsubscribe_variable` | subscriptionId: number | void |
| `get_variable` | varName: string | VariableResponse |
| `get_all_variables` | none | AllVariablesResponse |
| `set_variable` | varName, type, value | boolean |
| `create_variable` | varName, type, initialValue | boolean |

## Additional Resources

- Technical implementation details: `Variable-Streaming-Technical.md`
- API creation guide: `README.md`
- Example usage: `frontend/src/features/cpp-api/examples/`
  - `VariableMonitor.tsx` - Variable display grid
  - `CircleDemo.tsx` - Bidirectional control example
