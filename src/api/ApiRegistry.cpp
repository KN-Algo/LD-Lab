#include "api/ApiRegistry.h"
#include "api/examples/Adder.h"
#include "api/examples/Greeter.h"
#include "api/streaming/StreamingApi.h"
#include <print>

namespace api {

void registerAll(saucer::smartview& webview) {
    std::println("Rejestrowanie API dla Reacta...");

    Greeter::registerApi(webview);
    Adder::registerApi(webview);
    StreamingApi::registerStreamingApi(webview);
    
    std::println("API zarejestrowane pomyślnie!");
}

} // namespace api
