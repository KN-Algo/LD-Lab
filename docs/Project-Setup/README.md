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
- **G++** >= 14 lub **Clang** >= 17
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
npm run build
npm run dev
```

*Vite uruchomi się na porcie domyślnym (zazwyczaj `http://localhost:5173`).*

### Krok 2: Skonfiguruj i uruchom C++ (VS Code)

1. Otwórz główny folder projektu w VS Code.
2. Wciśnij <kbd>Ctrl</kbd> / <kbd>⌘ Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> i wpisz **`CMake: Select Variant`** a następnie wybierz **Debug**
3. Wciśnij <kbd>Ctrl</kbd> / <kbd>⌘ Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> i wpisz: **`CMake: Configure`**.
4. Kliknij przycisk **Build** (lub <kbd>F7</kbd>).
5. Uruchom plik wykonywanlny (ikona "Play" na pasku CMake lub <kbd>Shift</kbd> + <kbd>F5</kbd>).

Aplikacja otworzy okno, które w środku ładuje `http://localhost:5173`. Masz dostęp do DevTools pod <kbd>F12</kbd>.

---

## Jak zbudować (Production)

W tym trybie React jest kompilowany do plików statycznych, a następnie "wdrukowywany" w plik wykonywalny. Aplikacja jest **jednym plikiem**, nie wymaga serwera `Node.js` ani konsoli w tle.

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

Gotowy plik `LD-Lab` znajdziesz w folderze `build/`.

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

## Autosetup

Budowanie i uruchamianie aplikacji tym skryptem zostało przetestowane na **Windows 11**. Wariant dla Fedory oczekuje na sprawdzenie.

W głównym folderze projektu uruchom:

```bash
node build.mjs
```

Skrypt instaluje zależności frontendu (`npm ci`), buduje frontend, konfiguruje CMake, kompiluje aplikację w trybie **Release** i uruchamia LD-Lab. Nie trzeba osobno uruchamiać serwera Vite.

Wymagane są **Node.js >=24**, **Git** i **CMake** dostępne w terminalu. CMake musi obsługiwać zainstalowaną wersję Visual Studio.

- **Windows 11:** zainstaluj Visual Studio lub Visual Studio Build Tools z narzędziami **Desktop development with C++** i **Windows SDK**. Jeśli masz już Visual Studio bez narzędzi C++, skrypt spróbuje je doinstalować; Windows poprosi o uprawnienia administratora. Kompilacja korzysta z **MSVC**.
- **Fedora:** zainstaluj zależności systemowe przed uruchomieniem skryptu:

```bash
sudo dnf install gcc-c++ cmake make git pkgconf-pkg-config gtk4-devel libadwaita-devel json-glib-devel webkitgtk6.0-devel
```

Pierwsze budowanie wymaga dostępu do Internetu do pobrania zależności.

Aby tylko zbudować aplikację, bez uruchamiania:

```bash
node build.mjs --build-only
```

Gotową aplikację znajdziesz w `build/run-windows/Release/LD-Lab.exe` (Windows) lub `build/run-fedora/LD-Lab` (Fedora).
