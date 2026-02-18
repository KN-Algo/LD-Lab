#pragma once

#include <saucer/smartview.hpp>

namespace api {

/**
 * Rejestruje wszystkie funkcje API w webview
 * Automatycznie wykrywa i rejestruje wszystkie moduły
 */
void registerAll(saucer::smartview& webview);

} // namespace api
