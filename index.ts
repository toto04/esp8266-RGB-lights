import mosca from 'mosca'
import mqtt, { MqttClient } from 'mqtt'
import convert from 'color-convert'
let Service: any, Characteristic: any, client: MqttClient

export default (homebridge: any) => {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

    let broker = new mosca.Server({ port: 1883 })
    broker.on('clientConnected', (c: { id: any; }) => {
        console.log(`connected client: ${c.id}`)
    })

    client = mqtt.connect('mqtt://localhost')

    homebridge.registerAccessory('homebridge-esp8266-rgb-lights', 'RGBLights', RGBLights)
}

class RGBLights {
    log: any
    config: any
    name: string
    on: boolean
    hue: number
    bri: number
    sat: number
    service: any

    constructor(log: any, config: any) {
        this.log = log
        this.config = config
        this.name = config.name

        this.on = false
        this.hue = 0
        this.bri = 0
        this.sat = 0

        this.service = new Service.Lightbulb(this.name, 'RGB Strip')
        this.service.getCharacteristic(Characteristic.On)
            .on('set', (v: boolean, cb: () => void) => {
                this.on = v
                this.update()
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: boolean) => void) => {
                cb(null, this.on)
            })
        this.service.addCharacteristic(Characteristic.Hue)
            .on('set', (v: number, cb: () => void) => {
                this.hue = v
                this.update()
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: number) => void) => {
                cb(null, this.hue)
            })
        this.service.addCharacteristic(Characteristic.Brightness)
            .on('set', (v: number, cb: () => void) => {
                this.bri = v
                this.update()
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: number) => void) => {
                cb(null, this.bri)
            })
        this.service.addCharacteristic(Characteristic.Saturation)
            .on('set', (v: number, cb: () => void) => {
                this.sat = v
                this.update()
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: number) => void) => {
                cb(null, this.sat)
            })
    }

    update() {
        let rgb = convert.hsv.rgb(this.hue, this.sat, this.bri)
        let color = this.on ? rgb[0] * 256 * 256 + rgb[1] * 256 + rgb[2] : 0
        client.publish('color', color.toString())
    }

    getServices() {
        return [this.service]
    }
}