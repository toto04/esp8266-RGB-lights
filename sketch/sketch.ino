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
#include <Adafruit_NeoPixel.h>
#ifndef D4
#define D4 2
#endif

#define PIXELAMOUNT 18
#define LEDPIN D4

Adafruit_NeoPixel strip = Adafruit_NeoPixel(PIXELAMOUNT, LEDPIN, NEO_RGB + NEO_KHZ400);

#define STEPS 20
#define TRANSITION_TIME 500
int missingSteps = 0;

float cR = 0, tR = 0;
float cG = 0, tG = 0;
float cB = 0, tB = 0;

/* Code */
// callback for mqtt connection
void callback(char *topic, byte *payload, unsigned int length)
{
    String inTopic = String(topic);
    char pl[length];
    for (int i = 0; i < length; i++)
    {
        pl[i] = payload[i];
    }
    int value = String(pl).toInt();
    tR = (value >> 16) & 0xff;
    tG = (value >> 8) & 0xff;
    tB = value & 0xff;
    missingSteps = STEPS;
}

void setup()
{
    strip.begin();
    strip.clear();
    strip.show();
    WiFi.begin();
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

        if (!client.connected())
        {
            if (client.connect("ESP8266: ledstrip"))
            {
                client.subscribe("color");
            }
        }
        else
        {
            client.loop();
            if (missingSteps > 0)
            {
                updateColor();
                delay(TRANSITION_TIME / STEPS);
            }
        }
    }
}

void updateColor()
{
    cR += (tR - cR) / missingSteps;
    cG += (tG - cG) / missingSteps;
    cB += (tB - cB) / missingSteps;

    for (int i = 0; i < strip.numPixels(); i++)
    {
        strip.setPixelColor(i, strip.gamma32(strip.Color(cR, cG, cB)));
    }
    
    strip.show();
    missingSteps--;
}
