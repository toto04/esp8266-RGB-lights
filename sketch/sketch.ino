//Network
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>

const char *ssid = "Rete WiFi Morganti";
const char *pass = "0342070023";
const char *mqtt_server = "192.168.1.18"; // Raspberry PI's IP

WiFiClient wclient;
PubSubClient client = PubSubClient(wclient);

// LED configurations
#include <FastLED.h>

#define PIXELAMOUNT 18
#define LEDPIN 4

CRGBArray<PIXELAMOUNT> leds;

#define STEPS 20
#define TRANSITION_TIME 500
int missingSteps = 0;

float cR = 0, tR = 0;
float cG = 0, tG = 0;
float cB = 0, tB = 0;
int brightness = 0;
String mode = "perlin";

/* Code */
// callback for mqtt connection
void callback(char *topic, byte *payload, unsigned int length)
{
    String inTopic = String(topic);
    char pla[length];
    for (int i = 0; i < length; i++)
    {
        pla[i] = payload[i];
    }

    String pl = String(pla);

    if (inTopic == "color")
    {
        int value = pl.toInt();
        tR = (value >> 16) & 0xff;
        tG = (value >> 8) & 0xff;
        tB = value & 0xff;
    }
    else if (inTopic == "brightness")
    {
        brightness = pl.toInt();
    }
    else if (inTopic == "mode")
    {
        mode = pl;
    }

    missingSteps = STEPS;
}

void setup()
{
    FastLED.addLeds<WS2812, LEDPIN, RBG>(leds, PIXELAMOUNT).setCorrection(TypicalLEDStrip);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, pass);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
    }

    ArduinoOTA.begin();
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
}

void loop()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        ArduinoOTA.handle();
        // if (!client.connected())
        // {
        //     if (client.connect("ESP8266: ledstrip"))
        //     {
        //         client.subscribe("color");
        //         Serial.println("Subscibing to MQTT!");
        //     }
        // }
        // else
        // {
        //     client.loop();
        //     Serial.println("MQtt!!");
        // }
    }
    else
        WiFi.reconnect();

    if (mode == "fixed")
        fixed();
    else if (mode == "rainbow")
        fixed();
    else if (mode == "perlin")
        perlin();

    delay(33);
}

void fixed()
{
    // cR += (tR - cR) / missingSteps;
    // cG += (tG - cG) / missingSteps;
    // cB += (tB - cB) / missingSteps;

    // for (int i = 0; i < strip.numPixels(); i++)
    // {
    //     strip.setPixelColor(i, strip.gamma32(strip.Color(cR, cG, cB)));
    // }

    // strip.show();
    // missingSteps--;
}

static uint16_t perlinOffset = 0;
void perlin()
{
    for (int i = 0; i < PIXELAMOUNT; i++)
    {
        int bri = 220 + inoise8_raw(i * 100, perlinOffset * 10) * 40 / 70;
        if (bri > 255)
            bri = 255;
        if (bri < 0)
            bri = 0;

        leds[i] = CHSV(300, 247, bri);
    }
    FastLED.show();
    perlinOffset++;
}
