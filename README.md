# LD-Lab

[![KN Algo](https://img.shields.io/badge/Made%20by-KN%20Algo-000424?style=flat-square&logo=cplusplus)](https://algo.pwr.edu.pl/)
[![PWr](https://img.shields.io/badge/Affiliation-PWr-red?style=flat-square)](https://pwr.edu.pl/)
[![License](https://img.shields.io/badge/License-GPLv3-purple?style=flat-square)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Development-orange?style=flat-square)]()

> Symulator języka drabinkowego (ang. Ladder Diagram, LD).

## 📋 O projekcie
Projekt koncentruje się na stworzeniu przystępnego i elastycznego środowiska do nauki programowania sterowników PLC, bez konieczności posiadania fizycznego sterownika.

* **Problem:** Nauka programowania PLC często wiąże się z brakiem dostępu do sprzętu oraz brakiem modularności i wygody w darmowych narzędziach, co utrudnia zrozumienie zaawansowanych pojęć.
* **Cel:** Stworzenie w pełni funkcjonalnego i elastycznego środowiska edukacyjnego, umożliwiającego budowę złożonych algorytmów oraz monitorowanie wartości zmiennych w czasie.


### 🚀 Funkcjonalności
#### Iteracja 1: Bare Minimum (Fundamenty)
* [ ] **Obsługa podstawowych styków i cewek**: Implementacja wejść/wyjść Normalnie Otwartych (NO), Normalnie Zamkniętych (NC) oraz instrukcji Set i Reset.
* [ ] **System zmiennych**: Obsługa typów logicznych (BOOL) oraz liczbowych (INT), reprezentujących również sygnały analogowe.
* [ ] **Moduły liczników**: Zliczanie zdarzeń w górę (CTU), w dół (CTD) oraz dwukierunkowo.
* [ ] **Mechanizmy czasowe**: Implementacja timerów z opóźnionym załączeniem (Timer ON) i wyłączeniem (Timer OFF).
* [ ] **Logika i porównania**: Obsługa komparatorów (równe, większe, mniejsze), operatorów (AND, OR) oraz detekcji zboczy sygnału.

#### Iteracja 2: Rozszerzenie i Diagnostyka
* [ ] **Dokumentacja kodu**: Możliwość dodawania komentarzy do poszczególnych szczebli (rungów) oraz bloków funkcyjnych.
* [ ] **Manipulacja danymi**: Wprowadzenie rejestrów blokowych, instrukcji przesyłania danych (MOVE) oraz operacji matematycznych (ABS, MOD, MAX, MIN).
* [ ] **Operacje bitowe**: Bezpośrednia manipulacja bitami w rejestrach poprzez przesuwanie w lewo i w prawo.
* [ ] **Wizualizacja i monitoring**: Śledzenie zmian wartości zmiennych analogowych w czasie rzeczywistym.


#### Iteracja 3: Modularność i Abstrakcja
* [ ] **Modularność (User FB)**: Mechanizm automatycznego generowania bloków funkcyjnych z istniejącej logiki LD.
* [ ] **Reużywalność**: Możliwość wielokrotnego osadzania tego samego bloku w różnych miejscach programu bez kopiowania kodu źródłowego.

#### Iteracja 4: Zaawansowana Automatyka

* [ ] **Regulacja PID**: Wprowadzenie gotowego bloku regulatora PID z interfejsem do modyfikacji parametrów i podglądu procesu.

## 🛠 Technologie
Projekt opiera się na architekturze hybrydowej, łączącej wydajność natywną z elastycznością nowoczesnych interfejsów webowych.

### **Warstwa Wizualna**
- Język: **TypeScript**
- Framework: **React (Vite)**
- Komunikacja: Integracja z backendem poprzez moduł **Saucer**

### **Silnik obliczeniowy**

- Język: **C++23** oparty na frameworku **Saucer**

### **Narzędzia dodatkowe**
- **CMake** (do budowania projektu i zarządzania zależnościami)

## 💻 Jak uruchomić (Getting Started)
Wszystkie informacje odnośnie uruchamiania aplikacji (kompilacja dla developerki jak i generowania binarek znajduje się [tutaj](/docs/Project%20Setup/README.md)
<!--
## 🛠 Technologie.
 Wymień główne języki i biblioteki.

* **Język:** Python 3.9 / C++17 / Java
* **Biblioteki:** NumPy, Pandas, SFML, OpenCV
* **Narzędzia:** Docker, CMake -->
<!--
## 💻 Jak uruchomić (Getting Started)
 Instrukcja krok po kroku, jak uruchomić projekt lokalnie.

### Wymagania wstępne
Co użytkownik musi mieć zainstalowane?
* `python >= 3.8`
* `gcc`

### Instalacja

1. Sklonuj repozytorium:
   ```bash
   git clone [https://github.com/KN-Algo/nazwa-projektu.git](https://github.com/KN-Algo/nazwa-projektu.git)
   ```

2.  Zainstaluj zależności:
    ```bash
    pip install -r requirements.txt
    # lub
    npm install
    ```

### Uruchomienie

Przykładowe komenda do uruchomienia głównego skryptu:

```bash
python main.py --input data/input.txt
``` -->

<!-- ## 🧠 Teoria i Algorytmy (Opcjonalne)

Jeśli projekt jest algorytmiczny, opisz:

  * Zastosowane algorytmy.
  * Złożoność obliczeniową (np. $`O(n \log n)`$).
  * Strukturę danych.

Możesz dodać pseudokod lub diagramy. -->

<!-- ## 📊 Przykładowe wyniki

Jeden obraz znaczy więcej niż 1000 słów. Wstaw tutaj zrzut ekranu aplikacji, wykres wydajności lub GIF z działania algorytmu. -->

## 🤝 Twórcy

Projekt realizowany przez członków **KN Algo** przy Politechnice Wrocławskiej:

  * **[Bartłomiej Kuk](https://github.com/PEXEL2002)** - Team Leader, Pomysłodawca projektu
  * **[Adrian Goral](https://github.com/xEdziu)** - Integracja frontendu z backendem, tester i wsparcie programistów
  * **[Wiktor Jankowski-Ostrowski](https://github.com/WiktorPWR)** - Wsparcie merytoryczne, autor dokumentacji wymagań

-----

<div align="center">
Stworzone z ❤️ przez <a href="https://algo.pwr.edu.pl/">KN Algo</a> | Politechnika Wrocławska
</div>
