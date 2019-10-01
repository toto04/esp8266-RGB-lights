import Ticker from './ticker'
import mqtt, { MqttClient } from 'mqtt'
import mosca from 'mosca'

export enum Mode {
    fixed,
    perlin,
    rainbow
}

export default class Light {
    private sender = new Ticker(200)
    private on = false
    strips: { h: number, s: number, v: number, set: (h: number, s: number, v: number) => void }[][] = []
    name: string
    mode: Mode = Mode.fixed

    client: MqttClient
    broker: any

    constructor(name: string, ...stripLengths: number[]) {
        this.name = name
        for (let i = 0; i < stripLengths.length; i++) {
            let pixs: { h: number, s: number, v: number, set: (h: number, s: number, v: number) => void }[] = []
            for (let j = 0; j < stripLengths[i]; j++) pixs.push({
                h: 0,
                s: 0,
                v: 100,
                set: (h: number, s: number, v: number) => {
                    this.strips[i][j].h = h
                    this.strips[i][j].s = s
                    this.strips[i][j].v = v
                    this.sender.once(0, () => {
                        this.updateLights()
                    })
                }
            })
            this.strips.push(pixs)
        }

        this.broker = new mosca.Server({ port: 1883 })
        this.broker.on('clientConnected', (c: { id: any; }) => {
            console.log(`[broker] connected client: ${c.id}`)
        })
        // this.broker.on('published', (packet) => {
        //     console.log(packet.topic, packet.payload)
        // })
        this.client = mqtt.connect('mqtt://localhost')
    }

    private updateLights() {
        let arrBuffer: number[] = [this.mode]
        for (let strip of this.strips) {
            for (let pixel of strip) {
                arrBuffer.push(Math.round(pixel.h * 255 / 360))
                arrBuffer.push(Math.round(pixel.s * 255 / 100))
                arrBuffer.push(this.on ? Math.round(pixel.v * 255 / 100) : 0)
            }
        }
        this.client.publish(this.name, Buffer.from(arrBuffer))
    }

    setHue(hue: number) {
        for (let strip of this.strips) for (let pixel of strip) pixel.h = hue
        this.sender.once(0, () => {
            this.updateLights()
        })
    }

    setSaturation(saturation: number) {
        for (let strip of this.strips) for (let pixel of strip) pixel.s = saturation
        this.sender.once(0, () => {
            this.updateLights()
        })
    }

    setBrightness(brightness: number) {
        for (let strip of this.strips) for (let pixel of strip) pixel.v = brightness
        this.sender.once(0, () => {
            this.updateLights()
        })
    }

    toObject() {
        return { strips: this.strips, mode: Mode[this.mode], on: this.on }
    }

    get hue() {
        return this.strips[0][0].h
    }
    set hue(v: number) {
        this.setHue(v)
    }

    get saturation() {
        return this.strips[0][0].s
    }
    set saturation(v: number) {
        this.setSaturation(v)
    }

    get brightness() {
        return this.strips[0][0].v
    }
    set brightness(v: number) {
        this.setBrightness(v)
    }

    turn(val: 'on' | 'off') {
        this.on = val == 'on'
    }
    get state() { return this.on }
}