const mosca = require('mosca')
const mqtt = require('mqtt')
const convert = require('color-convert')
let Service, Characteristic, client

module.exports = (homebridge) => {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

    let broker = new mosca.Server({ port: 1883 })
    broker.on('clientConnected', (c) => {
        console.log(`connected client: ${c.id}`)
    })

    client = mqtt.connect('mqtt://localhost')

    homebridge.registerAccessory('homebridge-esp8266-rgb-lights', 'RGBLights', RGBLights)
}

class RGBLights {
    constructor(log, config) {
        this.log = log
        this.config = config
        this.name = config.name

        this.on = false
        this.hue = 0
        this.bri = 0
        this.sat = 0

        this.service = new Service.Lightbulb(this.name, 'RGB Strip')
        this.service.getCharacteristic(Characteristic.On)
            .on('set', (v, cb) => {
                this.on = v
                this.update()
                cb()
            })
            .on('get', (cb) => {
                cb(null, this.on)
            })
        this.service.addCharacteristic(Characteristic.Hue)
            .on('set', (v, cb) => {
                this.hue = v
                this.update()
                cb()
            })
            .on('get', (cb) => {
                cb(null, this.hue)
            })
        this.service.addCharacteristic(Characteristic.Brightness)
            .on('set', (v, cb) => {
                this.bri = v
                this.update()
                cb()
            })
            .on('get', (cb) => {
                cb(null, this.bri)
            })
        this.service.addCharacteristic(Characteristic.Saturation)
            .on('set', (v, cb) => {
                this.sat = v
                this.update()
                cb()
            })
            .on('get', (cb) => {
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