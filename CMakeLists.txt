cmake_minimum_required(VERSION 3.25)

project(LD-Lab LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    message(STATUS "👉 Wykryto GCC - wyłączam sprawdzanie wersji kompilatora dla Saucer")
    set(saucer_no_compiler_version_check ON CACHE BOOL "" FORCE)
endif()

if(WIN32)
    message(STATUS "👉 Wykryto Windows - konfiguracja pod WebView2 i ukrywanie konsoli")
    set(saucer_prefer_system ON CACHE BOOL "" FORCE)
endif()

include(FetchContent)

FetchContent_Declare(
    saucer
    GIT_REPOSITORY https://github.com/saucer/saucer
    GIT_TAG v8.0.4
)
FetchContent_MakeAvailable(saucer)

file(GLOB_RECURSE PROJECT_SOURCES "src/*.cpp")

add_executable(${PROJECT_NAME} ${PROJECT_SOURCES})

target_include_directories(${PROJECT_NAME} PRIVATE include)

if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/frontend/dist")
    saucer_embed("frontend/dist" TARGET ${PROJECT_NAME})
else()
    message(WARNING "⚠️ Folder frontend/dist nie istnieje! Uruchom 'npm run build' w folderze frontend.")
endif()

target_link_libraries(${PROJECT_NAME}
    PRIVATE
    saucer::saucer
    saucer::embedded
)

if(WIN32)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE $<CONFIG:Release>
    )

    target_link_options(${PROJECT_NAME} PRIVATE "$<$<CONFIG:Release>:/ENTRY:mainCRTStartup>")
endif()

if(APPLE)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE TRUE
        MACOSX_BUNDLE_BUNDLE_NAME "LD-Lab"
    )
endif()
