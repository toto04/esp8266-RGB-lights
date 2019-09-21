import Server from './server'
import Ticker from './ticker'
import mqtt, { MqttClient } from 'mqtt'
import mosca from 'mosca'

enum Mode {
    fixed = 0,
    perlin = 1,
    rainbow = 2
}

export default class Light {
    private nPixels: number
    private pixels: { h: number, s: number, v: number }[] = []
    private on = false
    private sender = new Ticker(200)
    name: string
    mode: Mode = Mode.fixed

    server = new Server()
    client: MqttClient
    broker: any

    constructor(name: string, nPixels: number) {
        this.name = name
        for (let i = 0; i < nPixels; i++) this.pixels.push({ h: 0, s: 0, v: 100 })

        this.broker = new mosca.Server({ port: 1883 })
        this.broker.on('clientConnected', (c: { id: any; }) => {
            console.log(`[broker] connected client: ${c.id}`)
        })
        this.broker.on('published', (packet) => {
            console.log(packet.topic, packet.payload)
        })
        this.client = mqtt.connect('mqtt://localhost')

        this.server.on('color', (id: number, h: number, s: number, v: number) => {
            this.setHue(h, id)
            this.setSaturation(s, id)
            this.setBrightness(v, id)
        })

        this.server.on('mode', (mode: string) => {
            this.mode = Mode[mode]
            this.sender.once(0, () => {
                this.updateLights()
            })
        })

        this.server.on('jsonReq', () => {
            this.server.emit('jsonRes', this.toJSON())
        })
    }

    private updateLights() {
        console.log(this.mode, Buffer.from([this.mode]))
        let arrBuffer: number[] = [this.mode]
        for (let pixel of this.pixels) {
            arrBuffer.push(pixel.h)
            arrBuffer.push(pixel.s)
            arrBuffer.push(pixel.v)
        }
        this.client.publish(this.name, Buffer.from(arrBuffer))
    }

    setHue(hue: number, id?: number) {
        if (id == undefined) for (let i = 0; i < this.nPixels; i++) {
            this.pixels[i].h = hue
        } else {
            this.pixels[id].h = hue
        }
        this.sender.once(0, () => {
            this.updateLights()
        })
    }

    setSaturation(saturation: number, id?: number) {
        if (id == undefined) for (let i = 0; i < this.nPixels; i++) {
            this.pixels[i].s = saturation
        } else {
            this.pixels[id].s = saturation
        }
        this.sender.once(0, () => {
            this.updateLights()
        })
    }

    setBrightness(brightness: number, id?: number) {
        if (id == undefined) for (let i = 0; i < this.nPixels; i++) {
            this.pixels[i].v = brightness
        } else {
            this.pixels[id].v = brightness
        }
        this.sender.once(0, () => {
            this.updateLights()
        })
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