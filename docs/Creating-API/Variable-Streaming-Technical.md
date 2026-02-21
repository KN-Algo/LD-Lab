# Variable Streaming - Technical Implementation

## Architecture Overview

The Variable Streaming system provides real-time bidirectional communication between the C++ backend and React frontend using a push-based notification architecture.

### Key Components

#### Backend (C++)

1. **VariableTable** (`src/api/VariableTable.cpp`)
   - Thread-safe singleton managing all variables
   - Supports three types: BOOL, INT, FLOAT
   - Implements observer pattern for change notifications
   - Thread synchronization via `std::shared_mutex`

2. **StreamingApi** (`src/api/streaming/StreamingApi.cpp`)
   - Exposes JavaScript-callable functions
   - Manages subscription lifecycle
   - Provides CRUD operations for variables

3. **VariableInitializer** (`src/api/VariableInitializer.cpp`)
   - Initializes demo variables on startup
   - Separated from main application logic

4. **VariableUpdater** (`src/api/VariableUpdater.cpp`)
   - Background service updating variables
   - Runs on separate thread
   - Updates demo variables at 500ms intervals

#### Frontend (React/TypeScript)

1. **useVariablePush** (`frontend/src/features/cpp-api/api/use-variable-push.ts`)
   - React hook for real-time variable updates
   - Uses global window callback mechanism
   - Manages subscription lifecycle automatically

2. **useVariableControl** (`frontend/src/features/cpp-api/api/use-variable-control.ts`)
   - Hook for creating and modifying variables
   - Provides debounced setValue function
   - Error handling and loading states

3. **subscriptionCache** (`frontend/src/lib/subscription-cache.ts`)
   - Global cache for subscription IDs
   - Prevents duplicate subscriptions
   - Persists across component remounts

## Communication Flow

### Push Notification Architecture

```
Backend Thread               VariableTable              Frontend
     |                            |                         |
     |-- update variable -------->|                         |
     |                            |-- notifyFrontend() ---->|
     |                            |   (throttled 16ms)      |
     |                            |                         |
     |                            |-- execute JS ---------->|
     |                            |  window.onVariableChange|
     |                            |                         |
     |                            |                    update state
```

### Subscription Flow

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

### Value Update Flow

```
Frontend                Backend API            VariableTable
   |                         |                      |
   |-- setValue() --------->|                      |
   |   (debounced 100ms)    |                      |
   |                        |-- set() ------------>|
   |                        |              validate type
   |                        |              update value
   |                        |              notify observers
   |                        |              notifyFrontend()
   |                        |                      |
   |<-- push notification ------------------------|
```

## Thread Safety

### VariableTable Synchronization

- **Read operations**: Use `std::shared_lock` (multiple readers allowed)
- **Write operations**: Use `std::unique_lock` (exclusive access)
- **Callback execution**: Occurs within lock scope to ensure consistency
- **Push notifications**: Throttled per variable to prevent race conditions

### Mutex Strategy

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

## Performance Optimizations

### Throttling Mechanisms

#### Backend Throttling
- Rate limit: 16ms per variable (approximately 60 updates/second)
- Implementation: Per-variable timestamp tracking
- Purpose: Prevent JavaScript execution flooding

```cpp
static constexpr std::chrono::milliseconds PUSH_THROTTLE_MS{16};
std::map<std::string, std::chrono::steady_clock::time_point> m_lastPushTime;
```

#### Frontend Debouncing
- Debounce delay: 100ms
- Applied to: setValue operations
- Purpose: Reduce API call frequency during rapid user input

```typescript
const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

debounceTimerRef.current = setTimeout(async () => {
    await setValue(varName, type, value);
}, 100);
```

### Value Change Detection

Backend only triggers notifications when value actually changes:

```cpp
bool changed = false;
if (std::holds_alternative<int>(var.value)) {
    changed = std::get<int>(var.value) != std::get<int>(newValue);
}

if (!changed) {
    return;  // Skip callbacks
}
```

Frontend performs similar comparison before state updates:

```typescript
setVariables((prev) => {
    if (prev[name]?.value === newValue) {
        return prev;  // No re-render
    }
    return { ...prev, [name]: newValue };
});
```

## Memory Management

### Subscription Lifecycle

1. **Creation**: Subscription ID assigned incrementally
2. **Storage**: Stored in global cache (frontend) and map (backend)
3. **Cleanup**: Manual unsubscribe required
4. **Persistence**: IDs cached globally, reused on remount

### Variable Storage

- Variables stored in `std::map<std::string, Variable>`
- Value type: `std::variant<bool, int, float>`
- Memory footprint: Approximately 64 bytes per variable
- No automatic cleanup (manual remove required)

## WebView Integration

### JavaScript Execution

The system uses Saucer's `execute()` method to push notifications:

```cpp
void VariableTable::notifyFrontend(const Variable& var) {
    auto* webview = static_cast<saucer::smartview*>(m_webview);
    
    webview->execute(
        "if (window.onVariableChange) {{ window.onVariableChange({}, {}, {}); }}",
        var.name, typeStr, jsValue
    );
}
```

### Global Callback Registration

Frontend registers global handler once:

```typescript
if (!window.onVariableChange) {
    window.onVariableChange = (name: string, type: string, value: number) => {
        const listeners = window.__variableChangeListeners?.get(name);
        listeners?.forEach(listener => listener({ name, type, value }));
    };
}
```

## Type System

### Variable Types

| Type | C++ Type | JavaScript Type | Range |
|------|----------|----------------|-------|
| BOOL | `bool` | `number` | 0 or 1 |
| INT | `int` | `number` | -2147483648 to 2147483647 |
| FLOAT | `float` | `number` | IEEE 754 single precision |

### Type Conversion

#### Backend to Frontend
```cpp
double jsValue = 0.0;
if (std::holds_alternative<bool>(var.value)) {
    jsValue = std::get<bool>(var.value) ? 1.0 : 0.0;
} else if (std::holds_alternative<int>(var.value)) {
    jsValue = static_cast<double>(std::get<int>(var.value));
}
```

#### Frontend to Backend
```cpp
if (type == VariableType::INT) {
    table.set(varName, type, static_cast<int>(value));
} else if (type == VariableType::FLOAT) {
    table.set(varName, type, static_cast<float>(value));
}
```

## Error Handling

### Backend Error Strategy

- Type mismatches: Throw `std::runtime_error`
- Variable not found: Throw `std::runtime_error`
- Callback exceptions: Caught and logged, do not propagate
- Push notification failures: Logged to stderr, execution continues

### Frontend Error Strategy

- API call failures: Caught in try-catch, stored in error state
- Type errors: TypeScript compile-time checking
- Network errors: Propagated to caller via thrown exception
- Invalid subscription IDs: Logged to console, operation skipped

## Latency Characteristics

### Push-Based (Current)
- Average latency: < 20ms
- Latency breakdown:
  - Backend detection: < 1ms
  - JavaScript execution: 5-10ms
  - React state update: 5-10ms
- Bottleneck: React rendering pipeline

### Polling-Based (Previous)
- Average latency: 250ms (500ms interval)
- Worst case: 500ms
- Constant CPU overhead

## Scalability Considerations

### Current Limits
- Maximum variables: Limited by available memory
- Maximum subscribers per variable: Unlimited (map-based storage)
- Push notification rate: 60/second per variable
- Concurrent reads: Unlimited (shared_mutex)

### Potential Bottlenecks
1. JavaScript execution frequency (mitigated by throttling)
2. React re-render overhead (mitigated by memoization)
3. Mutex contention under high write load
4. Map lookup performance with > 10,000 variables

## Future Enhancements

### Phase 3 Considerations
- WebSocket transport layer (replace JavaScript execute)
- Binary protocol for reduced overhead
- Batched notifications
- Differential updates (only changed fields)
- Connection resilience and reconnection logic
- Server-side filtering and aggregation

## Dependencies

### Backend
- C++23 standard library
- Saucer WebView library
- `<print>` for logging
- `<chrono>` for timing
- `<shared_mutex>` for synchronization

### Frontend
- React 18+
- TypeScript 5+
- No external dependencies for streaming logic
