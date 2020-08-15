//Network
#include <ESP8266WiFi.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>

const char *ssid = "Rete WiFi Morganti";
const char *pass = "0342070023";
const char *mqtt_server = "192.168.1.23"; // Raspberry PI's IP
const char *name = "tommaso";

WiFiClient wclient;
PubSubClient client = PubSubClient(wclient);

// LED configurations
#include <FastLED.h>

#define MONITOR 38
#define DESK 54
#define PIXELAMOUNT DESK + MONITOR
#define LEDPIN 4

CRGB monitor[MONITOR];
CRGB leds[DESK];
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

void connectClient()
{
    if (client.connect("Luci Tommaso"))
    {
        client.subscribe(name);
        // Serial.println("subbed");
    }
}

void flash(uint8_t hue, uint8_t sat, uint8_t maxbri, unsigned int length)
{
    uint8_t i = 0;
    while (i < maxbri)
    {
        for (int j = 0; j < length; j++)
            leds[j] = CHSV(hue, sat, i);
        FastLED.show();
        delay(2);
        i++;
    }
    while (i > 0)
    {
        for (int j = 0; j < length; j++)
            leds[j] = CHSV(hue, sat, i);
        FastLED.show();
        delay(2);
        i--;
    }
}

void setup()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
        colors[i] = CHSV(0, 0, 255);
    FastLED.addLeds<NEOPIXEL, 1>(monitor, MONITOR)
        .setCorrection(TypicalLEDStrip)
        .setTemperature(Tungsten100W);
    FastLED.addLeds<NEOPIXEL, LEDPIN>(leds, DESK)
        .setCorrection(TypicalLEDStrip)
        .setTemperature(Tungsten100W);
    FastLED.clear();

    WiFi.setAutoConnect(true);
    WiFi.setAutoReconnect(true);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, pass);

    while (WiFi.status() != WL_CONNECTED)
        flash(139, 205, 255, 1);

    ArduinoOTA.setHostname(name);
    ArduinoOTA.onStart([]() {
        FastLED.clear();
    });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        double bar = ((double)progress / (double)total) * PIXELAMOUNT;
        double complete, last;
        last = modf(bar, &complete);
        int i = 0;
        while (i < complete)
        {
            leds[i] = CHSV(139, 205, 100);
            i++;
        }
        leds[i] = CHSV(139, 205, int(last * 100));
        FastLED.show();
    });
    ArduinoOTA.onEnd([]() {
        flash(139, 205, 150, PIXELAMOUNT);
    });
    ArduinoOTA.onError([](ota_error_t error) {
        flash(0, 255, 150, PIXELAMOUNT);
    });
    ArduinoOTA.begin();
    client.setBufferSize(512);
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
    connectClient();
}

void loop()
{
    ArduinoOTA.handle();
    if (!client.loop())
        connectClient();
    // Serial.println("looping");

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

    if (!client.connected())
    {
        uint8_t bri = colors[0].v;
        if (bri < 30)
            bri = 30;
        leds[0] = CHSV(45, 255, bri);
    }

    if (missingSteps)
        missingSteps--;
    FastLED.show(); // outputs to the leds
    delay(33);      // refreshes on 30Hz
}

void fixed()
{
    if (missingSteps)
        for (int i = 0; i < PIXELAMOUNT; i++)
        {
            const CRGB newColor = colors[i];
            if (i < MONITOR)
            {
                monitor[i].r += ((int)newColor.r - (int)monitor[i].r) / missingSteps;
                monitor[i].g += ((int)newColor.g - (int)monitor[i].g) / missingSteps;
                monitor[i].b += ((int)newColor.b - (int)monitor[i].b) / missingSteps;
            }
            else
            {
                int idx = i - MONITOR;
                leds[idx].r += ((int)newColor.r - (int)leds[idx].r) / missingSteps;
                leds[idx].g += ((int)newColor.g - (int)leds[idx].g) / missingSteps;
                leds[idx].b += ((int)newColor.b - (int)leds[idx].b) / missingSteps;
            }
        }
}

static uint8_t rainbow_hue = 0;
void rainbow()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        if (i < MONITOR)
        {
            monitor[i] = CHSV(rainbow_hue - i * 15, 255, colors[i].v);
        }
        else
        {
            int idx = i - MONITOR;
            leds[idx] = CHSV(rainbow_hue - i * 15, 255, colors[idx].v);
        }
    }
    rainbow_hue++;
}

static uint16_t perlinOffset = 0;
#define VARIANCE 80  // how low the lowest valley will go
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
            if (i < MONITOR)
            {
                monitor[i].r += ((int)newColor.r - (int)monitor[i].r) / missingSteps;
                monitor[i].g += ((int)newColor.g - (int)monitor[i].g) / missingSteps;
                monitor[i].b += ((int)newColor.b - (int)monitor[i].b) / missingSteps;
            }
            else
            {
                int idx = i - MONITOR;
                leds[idx].r += ((int)newColor.r - (int)leds[idx].r) / missingSteps;
                leds[idx].g += ((int)newColor.g - (int)leds[idx].g) / missingSteps;
                leds[idx].b += ((int)newColor.b - (int)leds[idx].b) / missingSteps;
            }
        }
        else
        {
            if (i < MONITOR)
            {
                monitor[i] = newColor;
            }
            else
            {
                int idx = i - MONITOR;
                leds[idx] = newColor;
            }
        }
    }
    perlinOffset++;
}
