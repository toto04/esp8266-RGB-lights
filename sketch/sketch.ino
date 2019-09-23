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

enum class Mode
{
    fixed,
    perlin,
    rainbow
};

static Mode mode = Mode::fixed;

/* Code */
// callback for mqtt connection
void callback(char *top, byte *pl, unsigned int length)
{
    mode = (Mode)pl[0];
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        int idx = i * 3 + 1;
        colors[i].h = pl[idx + 0];
        colors[i].s = pl[idx + 1];
        colors[i].v = pl[idx + 2];
    }
    missingSteps = STEPS;
}

void setup()
{
    Serial.begin(115200);
    for (int i = 0; i < PIXELAMOUNT; i++)
        colors[i] = CHSV(0, 0, 255);
    FastLED.addLeds<WS2812, LEDPIN, RGB>(leds, PIXELAMOUNT)
        .setCorrection(TypicalLEDStrip)
        .setTemperature(Tungsten100W);
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
        client.subscribe("Tommy");
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

    switch (mode)
    {
    case Mode::fixed:
        fixed();
        break;
    case Mode::perlin:
        perlin();
        break;
    case Mode::rainbow:
        rainbow();
        break;
    default:
        fixed();
        break;
    }

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
#define VARIANCE 80 // how low the lowest valley will go
#define SPEED 10     // uint8, how fast the pattern changes
#define DISTANCE 100 // uint7, the difference between the pixels, the higher the tighter
void perlin()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        int bri = colors[i].v - (float)inoise8(i * DISTANCE, perlinOffset * SPEED) * (float)VARIANCE / 255.0;
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
            missingSteps--;
        }
        else
        {
            leds[i] = newColor;
        }
    }
    FastLED.show();
    perlinOffset++;
}
