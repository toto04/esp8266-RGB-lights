//Network
#include <ESP8266WiFi.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>

const char *ssid = "Rete WiFi Morganti";
const char *pass = "0342070023";
const char *mqtt_server = "192.168.1.23"; // Raspberry PI's IP

WiFiClient wclient;
PubSubClient client = PubSubClient(wclient);

// LED configurations
#include <FastLED.h>

#define MONITOR 35
#define DESK 81
#define SHELF 33
#define PIXELAMOUNT DESK + MONITOR + SHELF

CRGB monitor[MONITOR];
CRGB desk[DESK];
CRGB shelf[SHELF];
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
    // Serial.println(top);
    mode = (Mode)pl[0];
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        // Serial.println(pl[i]);
        int idx = i * 3 + 1;
        colors[i].h = pl[idx + 0];
        colors[i].s = pl[idx + 1];
        colors[i].v = pl[idx + 2];
    }
    missingSteps = STEPS;
}

void connectClient()
{
    if (client.connect("Luci Lorenzo"))
    {
        client.subscribe("lorenzo");
        // Serial.println("subbed");
    }
}

void flash(uint8_t hue, uint8_t sat, uint8_t maxbri, unsigned int length)
{
    uint8_t i = 0;
    while (i < maxbri)
    {
        for (int j = 0; j < length; j++)
            desk[j] = CHSV(hue, sat, i);
        FastLED.show();
        delay(2);
        i++;
    }
    while (i > 0)
    {
        for (int j = 0; j < length; j++)
            desk[j] = CHSV(hue, sat, i);
        FastLED.show();
        delay(2);
        i--;
    }
}

void setup()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
        colors[i] = CHSV(0, 0, 0);
    FastLED.addLeds<NEOPIXEL, 1>(monitor, MONITOR)
        .setCorrection(TypicalLEDStrip)
        .setTemperature(Tungsten100W);
    FastLED.addLeds<NEOPIXEL, 2>(desk, DESK)
        .setCorrection(TypicalLEDStrip)
        .setTemperature(Tungsten100W);
    FastLED.addLeds<NEOPIXEL, 4>(shelf, SHELF)
        .setCorrection(TypicalLEDStrip)
        .setTemperature(Tungsten100W);
    FastLED.clear();

    WiFi.setAutoConnect(true);
    WiFi.setAutoReconnect(true);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, pass);

    while (WiFi.status() != WL_CONNECTED)
        flash(139, 205, 255, 1);

    ArduinoOTA.setHostname("lorenzo");
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
            desk[i] = CHSV(139, 205, 100);
            i++;
        }
        desk[i] = CHSV(139, 205, int(last * 100));
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
        desk[0] = CHSV(45, 255, bri);
    }

    if (missingSteps)
        missingSteps--;
    FastLED.show(); // outputs to the leds
    delay(33);      // refreshes on 30Hz
}

void fixed()
{
    if (missingSteps)
    {
        for (int i = 0; i < PIXELAMOUNT; i++)
        {
            const CRGB newColor = colors[i];
            if (i < MONITOR)
            {
                monitor[i].r += ((int)newColor.r - (int)monitor[i].r) / missingSteps;
                monitor[i].g += ((int)newColor.g - (int)monitor[i].g) / missingSteps;
                monitor[i].b += ((int)newColor.b - (int)monitor[i].b) / missingSteps;
            }
            else if (i < MONITOR + DESK)
            {
                int idx = i - MONITOR;
                desk[idx].r += ((int)newColor.r - (int)desk[idx].r) / missingSteps;
                desk[idx].g += ((int)newColor.g - (int)desk[idx].g) / missingSteps;
                desk[idx].b += ((int)newColor.b - (int)desk[idx].b) / missingSteps;
            }
            else
            {
                int idx = i - MONITOR - DESK;
                shelf[idx].r += ((int)newColor.r - (int)shelf[idx].r) / missingSteps;
                shelf[idx].g += ((int)newColor.g - (int)shelf[idx].g) / missingSteps;
                shelf[idx].b += ((int)newColor.b - (int)shelf[idx].b) / missingSteps;
            }
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
        else if (i < MONITOR + DESK)
        {
            int idx = i - MONITOR;
            desk[idx] = CHSV(rainbow_hue - i * 15, 255, colors[idx].v);
        }
        else
        {
            int idx = i - MONITOR - DESK;
            shelf[idx] = CHSV(rainbow_hue - i * 15, 255, colors[idx].v);
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
            else if (i < MONITOR + DESK)
            {
                int idx = i - MONITOR;
                desk[idx].r += ((int)newColor.r - (int)desk[idx].r) / missingSteps;
                desk[idx].g += ((int)newColor.g - (int)desk[idx].g) / missingSteps;
                desk[idx].b += ((int)newColor.b - (int)desk[idx].b) / missingSteps;
            }
            else
            {
                int idx = i - MONITOR - DESK;
                shelf[idx].r += ((int)newColor.r - (int)shelf[idx].r) / missingSteps;
                shelf[idx].g += ((int)newColor.g - (int)shelf[idx].g) / missingSteps;
                shelf[idx].b += ((int)newColor.b - (int)shelf[idx].b) / missingSteps;
            }
            missingSteps--;
        }
        else
        {
            if (i < MONITOR)
            {
                monitor[i] = newColor;
            }
            else if (i < MONITOR + DESK)
            {
                int idx = i - MONITOR;
                desk[idx] = newColor;
            }
            else
            {
                int idx = i - MONITOR - DESK;
                shelf[idx] = newColor;
            }
        }
    }
    perlinOffset++;
}
