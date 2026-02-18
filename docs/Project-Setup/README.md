# Saucer + React Setup

Użyte technologie:
- **C++23** (backend) oparty na frameworku **Saucer**
- **React/Vite** (frontend)
- **CMake** build tool

## Wymagania wstępne

### Windows

Aby pracować nad projektem, potrzebujesz następujących narzędzi:

1. **Visual Studio 2026 (lub 2022)** (Community/Pro/Enterprise):
* Wymagany komponent: **Desktop development with C++** (Opracowywanie aplikacji klasycznych w C++) z dodatkową paczką **MSVC 143**.

2. **Visual Studio Code**:
* Zalecane rozszerzenie: **CMake Tools** (Microsoft).
* Zalecane rozszerzenie: **C/C++** (Microsoft).

3. **Node.js** w wersji >=24
4. **CMake** w wersji >=3.25 (zazwyczaj instaluje się z VS, ale warto mieć w systemie).

> **Ważne:** Projekt wymaga standardu **C++23**. Starsze kompilatory nie zadziałają.

### Linux / MacOs

- **Visual Studio Code**:
    * Zalecane rozszerzenie: **CMake Tools** (Microsoft).
    * Zalecane rozszerzenie: **C/C++** (Microsoft).
- **G++14**
- **CMake** w wersji >=3.25
- **Node.js** w wersji >=24

---

## Struktura Projektu

```text
LD-Lab/
├── CMakeLists.txt       # Główna konfiguracja budowania (Saucer, C++ version)
├── src/
│   └── main.cpp         # Punkt wejścia aplikacji (logika okna, mostek C++ <-> JS)
├── frontend/            # Aplikacja React (Vite + Tailwind v4 + Router)
│   ├── src/             # Kod źródłowy UI
│   ├── dist/            # Zbudowana strona (generowana przez npm run build)
│   └── vite.config.ts   # Konfiguracja Vite
├── build/               # Folder tymczasowy CMake (ignorowany przez git)
└── embedded/            # Automatycznie generowane nagłówki C++ z UI (ignorowany przez git)
```
---

## Jak uruchomić (Development)

W tym trybie mamy **Hot Reload**. Zmiany w kodzie Reacta są widoczne natychmiast bez restartowania aplikacji C++.
Zmiany w aplikacji C++ będą wymagały rebuilda aplikacji.

### Krok 1: Uruchom Frontend

Otwórz terminal w folderze `frontend/` i uruchom serwer deweloperski:

```bash
cd frontend
npm i
npm run dev
```

*Vite uruchomi się na porcie domyślnym (zazwyczaj `http://localhost:5173`).*

### Krok 2: Skonfiguruj i uruchom C++ (VS Code)

1. Otwórz główny folder projektu w VS Code.
2. Wciśnij <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> i wpisz **`CMake: Select Variant`** a następnie wybierz **Debug**
3. Wciśnij <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> i wpisz: **`CMake: Configure`**.
4. Kliknij przycisk **Build** (lub <kbd>F7</kbd>).
5. Uruchom plik `.exe` (ikona "Play" na pasku CMake lub <kbd>Shift</kbd> + <kbd>F5</kbd>).

Aplikacja otworzy okno, które w środku ładuje `http://localhost:5173`. Masz dostęp do DevTools pod <kbd>F12</kbd>.

---

## Jak zbudować (Production)

W tym trybie React jest kompilowany do plików statycznych, a następnie "wdrukowywany" w plik `.exe`. Aplikacja jest **jednym plikiem**, nie wymaga serwera `Node.js` ani konsoli w tle.

### Krok 1: Zbuduj Frontend

Musimy wygenerować pliki HTML/CSS/JS do folderu `frontend/dist`.

```bash
cd frontend
npm run build
```

### Krok 2: Zbuduj C++ w trybie Release

1. Wykonaj **`CMake: Select Variant`** na **Release**
2. Wykonaj **`CMake: Configure`** (wymusza odświeżenie flag kompilatora).
3. Wykonaj **`CMake: Build`**.

Gotowy plik `LD-Lab.exe` znajdziesz w folderze `build/Release/` (lub `build/`).

---

## Architektura

### 1. Mostek C++ <-> React

Komunikacja odbywa się dwukierunkowo.

**C++ (main.cpp):**

```cpp
// Wystawienie funkcji dla JS
webview->expose("hello_from_cpp", []() {
    return "Wiadomość z backendu!";
});
```

**React (App.tsx):**

```typescript
import { call } from "@saucer-dev/types";

const getData = async () => {
    // Drugi argument [] jest wymagany przez TypeScript
    const result = await call<string>("hello_from_cpp", []);
    console.log(result);
};
```

### 2. Mechanizm Embeddingu

W pliku `CMakeLists.txt` funkcja `saucer_embed` pakuje zawartość `frontend/dist` do nagłówków C++.

* W trybie **Debug** (`#else` w `main.cpp`): Aplikacja ignoruje embedded files i łączy się z localhost.
* W trybie **Release** (`#ifdef NDEBUG`): Aplikacja serwuje pliki bezpośrednio z pamięci RAM (`saucer::embedded::all()`).

---

## 📝 .gitignore

Pamiętaj, aby nie commitować folderów budowania:

```gitignore
build/
embedded/
node_modules/
frontend/dist/
frontend/node_modules/
.vs/
*.exe

```
