import Server from './server'
import convert from 'color-convert'
import mqtt, { MqttClient } from 'mqtt'
import mosca from 'mosca'

type Mode = 'fixed' | 'perlin noise' | 'rainbow'


export default class Light {
    private nPixels: number
    private pixels: { h: number, s: number, v: number }[] = []
    private on = false
    mode: Mode = 'fixed'

    server = new Server()
    client: MqttClient
    broker: any

    constructor(nPixels) {
        for (let i = 0; i < nPixels; i++) this.pixels.push({ h: 0, s: 0, v: 100 })

        this.broker = new mosca.Server({ port: 1883 })
        this.broker.on('clientConnected', (c: { id: any; }) => {
            console.log(`[broker] connected client: ${c.id}`)
        })
        this.broker.on('published', (packet) => {
            console.log(packet.topic, `"${packet.payload.toString()}"`)
        })
        this.client = mqtt.connect('mqtt://localhost')

        this.server.on('color', (id: number, h: number, s: number, v: number) => {
            this.setHue(h, id)
            this.setSaturation(s, id)
            this.setBrightness(v, id)
        })

        this.server.on('mode', (mode: Mode) => {
            this.mode = mode
            this.client.publish('mode', mode)
        })

        this.server.on('jsonReq', () => {
            this.server.emit('jsonRes', this.toJSON())
        })
    }

    setHue(hue: number, id?: number) {
        if (id == undefined) for (let i = 0; i < this.nPixels; i++) {
            this.pixels[i].h = hue
            this.client.publish('hue', `${i} ${Math.round(hue * 255 / 360)}`)
        } else {
            this.pixels[id].h = hue
            this.client.publish('hue', `${id} ${Math.round(hue * 255 / 360)}`)
        }
    }

    setSaturation(saturation: number, id?: number) {
        if (id == undefined) for (let i = 0; i < this.nPixels; i++) {
            this.pixels[i].s = saturation
            this.client.publish('saturation', `${i} ${Math.round(saturation * 255 / 100)}`)
        } else {
            this.pixels[id].s = saturation
            this.client.publish('saturation', `${id} ${Math.round(saturation * 255 / 100)}`)
        }
    }

    setBrightness(brightness: number, id?: number) {
        if (id == undefined) for (let i = 0; i < this.nPixels; i++) {
            this.pixels[i].v = brightness
            this.client.publish('brightness', `${i} ${Math.round(brightness * 255 / 100)}`)
        } else {
            this.pixels[id].v = brightness
            this.client.publish('brightness', `${id} ${Math.round(brightness * 255 / 100)}`)
        }
    }

    toJSON() {
        return JSON.stringify({ pixels: this.pixels, mode: this.mode })
    }

    get hue() {
        return this.pixels[0].h
    }
    set hue(v: number) {
        this.setHue(v)
    }

    get saturation() {
        return this.pixels[0].s
    }
    set saturation(v: number) {
        this.setSaturation(v)
    }

    get brightness() {
        return this.pixels[0].v
    }
    set brightness(v: number) {
        this.setBrightness(v)
    }

    turn(val: 'on' | 'off') {
        this.on = val == 'on'
    }
    get state() { return this.on }
}