//Network
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>

const char *ssid = "Rete WiFi Morganti";
const char *pass = "0342070023";
const char *mqtt_server = "192.168.1.7"; // Raspberry PI's IP

WiFiClient wclient;
PubSubClient client = PubSubClient(wclient);

// LED configurations
#include <FastLED.h>

#define PIXELAMOUNT 18
#define LEDPIN 4

CRGB leds[PIXELAMOUNT];
CHSV colors[PIXELAMOUNT];

#define STEPS 15
int missingSteps = STEPS;

String mode = "fixed";

/* Code */
// callback for mqtt connection
void callback(char *top, byte *pl, unsigned int length)
{
    String topic = String(top);
    char pla[length];
    for (int i = 0; i < length; i++)
    {
        pla[i] = pl[i];
    }
    String payload = String(pla);
    // -------------------------

    uint8_t pixId = payload.toInt();
    if (topic == "hue")
    {
        colors[pixId].h = payload.substring(payload.indexOf(' ') + 1).toInt();
    }
    else if (topic == "saturation")
    {
        colors[pixId].s = payload.substring(payload.indexOf(' ') + 1).toInt();
    }
    else if (topic == "brightness")
    {
        colors[pixId].v = payload.substring(payload.indexOf(' ') + 1).toInt();
    }
    else if (topic == "mode")
    {
        mode = payload;
    }
    missingSteps = STEPS;
}

void setup()
{
    Serial.begin(115200);
    for (int i = 0; i < PIXELAMOUNT; i++)
        colors[i] = CHSV(0, 0, 100);
    FastLED.addLeds<WS2812, LEDPIN, RGB>(leds, PIXELAMOUNT)
        .setCorrection(TypicalLEDStrip);
    FastLED.clear();
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, pass);
    while (WiFi.status() != WL_CONNECTED)
    {
        leds[0] = CRGB::Red;
        FastLED.show();
        delay(200);
        leds[0] = CRGB::Black;
        FastLED.show();
        delay(800);
    }

    ArduinoOTA.begin();
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
    if (client.connect("Luci Tommaso"))
    {
        client.subscribe("hue");
        client.subscribe("saturation");
        client.subscribe("brightness");
        client.subscribe("mode");
    }
}

void loop()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        ArduinoOTA.handle();
        client.loop();
    }
    else
        WiFi.reconnect();

    if (mode == "fixed")
        fixed();
    else if (mode == "rainbow")
        rainbow();
    else if (mode == "perlin")
        perlin();

    delay(33); // refreshes on 30Hz
}

void fixed()
{
    if (missingSteps)
    {
        for (int i = 0; i < PIXELAMOUNT; i++)
        {
            const CRGB newColor = colors[i];
            leds[i].r += ((int)newColor.r - (int)leds[i].r) / missingSteps;
            leds[i].g += ((int)newColor.g - (int)leds[i].g) / missingSteps;
            leds[i].b += ((int)newColor.b - (int)leds[i].b) / missingSteps;
        }
        Serial.println(missingSteps);
        Serial.println(leds[0].r);
        Serial.println(colors[0].h);
        Serial.println();
        FastLED.show();
        missingSteps--;
    }
}

static uint8_t rainbow_hue = 0;
void rainbow()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        leds[i] = CHSV(rainbow_hue - i * 15, 255, colors[i].v);
    }
    rainbow_hue++;
    FastLED.show();
}

static uint16_t perlinOffset = 0;
#define VARIANCE 150 // how low the lowest valley will go
#define SPEED 10     // uint8, how fast the pattern changes
#define DISTANCE 100 // uint7, the difference between the pixels, the higher the tighter
void perlin()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        int bri = colors[i].v - inoise8(i * DISTANCE, perlinOffset * SPEED) * VARIANCE / 255.0;
        if (bri > 255)
            bri = 255;
        if (bri < 0)
            bri = 0;

        const CRGB newColor = CHSV(colors[i].h, colors[i].s, bri);
        if (missingSteps)
        {
            leds[i].r += ((int)newColor.r - (int)leds[i].r) / missingSteps;
            leds[i].g += ((int)newColor.g - (int)leds[i].g) / missingSteps;
            leds[i].b += ((int)newColor.b - (int)leds[i].b) / missingSteps;
        }
        else
        {
            leds[i] = newColor;
        }
    }
    FastLED.show();
    perlinOffset++;
}
