cmake_minimum_required(VERSION 3.25)

project(LD-Lab LANGUAGES CXX)

# ==========================================
# 1. Konfiguracja Standardu C++ (Wspólna)
# ==========================================
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ==========================================
# 2. Wykrywanie i Łatki Systemowe
# ==========================================

# [LINUX / MACOS]
# Saucer v8 jest bardzo restrykcyjny co do wersji kompilatorów (wymaga Clang 17+ / GCC 14+).
# Jeśli wykryjemy GCC (popularne na Linuxie/WSL), wyłączamy sprawdzanie wersji,
# bo GCC 13 radzi sobie z C++23 wystarczająco dobrze.
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    message(STATUS "👉 Wykryto GCC - wyłączam sprawdzanie wersji kompilatora dla Saucer")
    set(saucer_no_compiler_version_check ON CACHE BOOL "" FORCE)
endif()

# [WINDOWS]
# Windows wymaga WebView2. Saucer próbuje pobrać go przez Nuget.
# Jeśli jesteś na Windows, upewnij się, że masz Internet przy pierwszym buildzie.
if(WIN32)
    message(STATUS "👉 Wykryto Windows - konfiguracja pod WebView2 i ukrywanie konsoli")
endif()

# ==========================================
# 3. Pobieranie Zależności (Saucer)
# ==========================================
include(FetchContent)

FetchContent_Declare(
    saucer
    GIT_REPOSITORY https://github.com/saucer/saucer
    GIT_TAG v8.0.4
)
FetchContent_MakeAvailable(saucer)

# ==========================================
# 4. Definicja Aplikacji
# ==========================================
add_executable(${PROJECT_NAME} src/main.cpp)

# ==========================================
# 5. Embedding (Pakowanie Reacta)
# ==========================================
# Ta komenda działa tak samo na każdym systemie.
# Wymaga tylko folderu 'frontend/dist' (zbudowanego przez npm).
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/frontend/dist")
    saucer_embed("frontend/dist" TARGET ${PROJECT_NAME})
else()
    message(WARNING "⚠️ Folder frontend/dist nie istnieje! Uruchom 'npm run build' w folderze frontend.")
endif()

# ==========================================
# 6. Linkowanie
# ==========================================
target_link_libraries(${PROJECT_NAME}
    PRIVATE
    saucer::saucer
    saucer::embedded
)

# ==========================================
# 7. Konfiguracja Końcowa (Platform Specific)
# ==========================================

# [WINDOWS] - Specyficzne flagi linkera
if(WIN32)
    # Ukrywa czarną konsolę TYLKO w trybie Release
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE $<CONFIG:Release>
    )

    # Naprawia błąd "missing WinMain" w trybie Release
    # Mówi linkerowi: "Mimo że to aplikacja okienkowa, zacznij od funkcji main()"
    target_link_options(${PROJECT_NAME} PRIVATE "$<$<CONFIG:Release>:/ENTRY:mainCRTStartup>")
endif()

# [MACOS] - Bundle aplikacji
if(APPLE)
    # Na MacOS aplikacje GUI to zazwyczaj "Bundle" (.app)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE TRUE
        MACOSX_BUNDLE_BUNDLE_NAME "LD-Lab"
    )
endif()
