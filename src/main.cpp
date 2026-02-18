#include <print>
#include <saucer/smartview.hpp>
#include <saucer/embedded/all.hpp>

coco::stray start(saucer::application *app)
{
    // Tworzenie okna i webview
    auto window  = saucer::window::create(app).value();
    auto webview = saucer::smartview::create({.window = window});

    // Ustawienia okna
    window->set_title("Saucer + React");
    window->set_size({1024, 768});

    // === 1. Twoja funkcja dla Reacta ===
    webview->expose("hello_from_cpp", []() {
        std::println("React zapytał o powitanie!");
        return "Pozdrowienia z C++ (Modern Syntax)!";
    });

    // === 2. Logika ładowania (Dev vs Prod) ===
#ifdef NDEBUG
    // Tryb RELEASE (spakowany plik)
    webview->embed(saucer::embedded::all());
    webview->serve("/index.html");
#else
    // Tryb DEBUG (Hot Reload z Vite)
    webview->set_url("http://localhost:5173");
    webview->set_dev_tools(true); // F12 działa
#endif

    window->show();

    co_await app->finish();
}

int main()
{
    return saucer::application::create({.id = "LD-Lab"})->run(start);
}
