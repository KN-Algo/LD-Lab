cmake_minimum_required(VERSION 3.25)

project(LD-Lab LANGUAGES CXX)

# === Konfiguracja C++ ===
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# === Dependencies (Saucer) ===
include(FetchContent)

FetchContent_Declare(
    saucer
    GIT_REPOSITORY https://github.com/saucer/saucer
    GIT_TAG v8.0.0
)
FetchContent_MakeAvailable(saucer)

# === Aplikacja ===
add_executable(${PROJECT_NAME} src/main.cpp)

# === React Embedding ===
# Saucer automatycznie "pakuje" folder frontend/dist do nagłówków
saucer_embed("frontend/dist" TARGET ${PROJECT_NAME})

# === Linkowanie ===
target_link_libraries(${PROJECT_NAME} 
    PRIVATE 
    saucer::saucer 
    saucer::embedded
)

# === Windows Setup ===
if(WIN32)
    # Ukrywa konsolę tylko w trybie Release (nie w Debug)
    set_target_properties(${PROJECT_NAME} PROPERTIES 
        WIN32_EXECUTABLE $<CONFIG:Release>
    )
endif()