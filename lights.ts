import Server from './server'
import convert from 'color-convert'
import mqtt, { MqttClient } from 'mqtt'
import mosca from 'mosca'

type Mode = 'fixed' | 'perlin noise' | 'rainbow'

export default class Lights {
    private on = false
    private intHue = 0
    private intSaturation = 0
    private intBrightness = 100
    mode: Mode = 'fixed'

    server = new Server()
    client: MqttClient
    broker: any

    constructor() {
        this.broker = new mosca.Server({ port: 1883 })
        this.broker.on('clientConnected', (c: { id: any; }) => {
            console.log(`[broker] connected client: ${c.id}`)
        })
        this.broker.on('published', (packet) => {
            console.log(packet.topic, packet.payload.toString())
        })
        this.client = mqtt.connect('mqtt://localhost')

        this.server.on('color', (hsv: [number, number, number]) => {
            this.intHue = hsv[0]
            this.intSaturation = hsv[1]
            this.intBrightness = hsv[2]
            this.updateColor()
        })

        this.server.on('brightness', (bri: number) => {
            this.intBrightness = bri
            this.updateBrightness()
        })

        this.server.on('mode', (mode: Mode) => {
            this.mode = mode
            this.updateMode()
        })
    }

    private updateColor() {
        let hex = convert.hsv.hex([this.intHue, this.intSaturation, this.intBrightness])
        this.client.publish('color', this.on ? parseInt(hex, 16).toString() : '0')
    }

    private updateBrightness() {
        this.client.publish('brightness', this.on ? this.intBrightness.toString() : '0')
    }

    private updateMode() {
        this.client.publish('mode', this.mode)
    }

    turn(val: 'on' | 'off') {
        this.on = val == 'on'
    }

    get hue() { return this.intHue }
    set hue(h: number) {
        this.intHue = h
        this.updateColor()
    }
    get saturation() { return this.intSaturation }
    set saturation(s: number) {
        this.intSaturation = s
        this.updateColor()
    }
    get brightness() { return this.intBrightness }
    set brightness(b: number) {
        this.intBrightness = b
        this.updateColor()
        this.updateBrightness()
    }
}