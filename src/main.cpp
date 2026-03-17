#include <print>
#include <saucer/smartview.hpp>
#include <saucer/embedded/all.hpp>
#include "api/ApiRegistry.h"
#include "api/VariableInitializer.h"
#include "api/VariableUpdater.h"
#include "api/streaming/BatchQueue.h"
#include "api/streaming/DeltaTracker.h"

static const std::string base64_chars = 
             "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "abcdefghijklmnopqrstuvwxyz"
             "0123456789+/";

std::string base64_encode(const std::vector<uint8_t>& buf) {
    std::string ret;
    int i = 0;
    int j = 0;
    uint8_t char_array_3[3];
    uint8_t char_array_4[4];
    size_t bufLen = buf.size();
    const uint8_t* bytes_to_encode = buf.data();

    while (bufLen--) {
        char_array_3[i++] = *(bytes_to_encode++);
        if (i == 3) {
            char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
            char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
            char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
            char_array_4[3] = char_array_3[2] & 0x3f;

            for(i = 0; (i <4) ; i++)
                ret += base64_chars[char_array_4[i]];
            i = 0;
        }
    }

    if (i) {
        for(j = i; j < 3; j++)
            char_array_3[j] = '\0';

        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
        char_array_4[3] = char_array_3[2] & 0x3f;

        for (j = 0; (j < i + 1); j++)
            ret += base64_chars[char_array_4[j]];

        while((i++ < 3))
            ret += '=';
    }
    return ret;
}

coco::stray start(saucer::application *app)
{
    // Initialize demo variables for streaming
    VariableInitializer::initialize();

    // Start background variable updater service
    VariableUpdater::start();

    // Tworzenie okna i webview
    auto window  = saucer::window::create(app).value();
    auto webview = saucer::smartview::create({.window = window});

    // Setup BatchQueue flush callback
    auto& batchQueue = streaming::BatchQueue::getInstance();
    batchQueue.onFlush([&webview](const std::vector<uint8_t>& binaryData) {
        std::string base64Data = base64_encode(binaryData);
        
        // Remove any newlines that might have been added
        base64Data.erase(std::remove(base64Data.begin(), base64Data.end(), '\n'), base64Data.end());
        base64Data.erase(std::remove(base64Data.begin(), base64Data.end(), '\r'), base64Data.end());
        
        webview->execute(
            "if (window.binaryUpdate) {{ window.binaryUpdate('{}'); }}",
            base64Data
        );
    });

    // Configure batching parameters
    batchQueue.configure(
        10,                                    // max 10 variables per batch
        std::chrono::milliseconds(16)         // or every 16ms
    );

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
