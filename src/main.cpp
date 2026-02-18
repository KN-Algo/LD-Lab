#include <print>
#include <saucer/smartview.hpp>
#include <saucer/embedded/all.hpp>
#include "api/ApiRegistry.h"

coco::stray start(saucer::application *app)
{
    // Tworzenie okna i webview
    auto window  = saucer::window::create(app).value();
    auto webview = saucer::smartview::create({.window = window});

    // Ustawienia okna
    window->set_title("LD-Lab - KN Algo");
    window->set_size({1024, 768});

    api::registerAll(*webview);

#ifdef NDEBUG
    webview->embed(saucer::embedded::all());
    webview->serve("/index.html");
#else
    webview->set_url("http://localhost:5173");
    webview->set_dev_tools(true);
#endif
    window->show();
    co_await app->finish();
}

int main()
{
    return saucer::application::create({.id = "LD-Lab"})->run(start);
}
