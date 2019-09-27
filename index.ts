import Light, { Mode } from './lights'
import express from 'express'
let app = express()
let Service: any, Characteristic: any

let lights = [
    new Light('tommaso', 18)
]

app.use(express.text())
app.post('/api/:light/:strip/:pixel', (req, res) => {
    let hsv = JSON.parse(req.body)
    let light = lights.find(l => l.name == req.params.light)
    light.strips[parseInt(req.params.strip)][parseInt(req.params.pixel)].set(hsv.h, hsv.s, hsv.v)
    res.end()
})
app.post('/api/:light/mode', (req, res) => {
    let light = lights.find(l => l.name == req.params.light)
    light.mode = Mode[String(req.body)]
    res.end()
})
app.use(express.static(__dirname + '/static'))
app.listen(2480)

export default (homebridge: any) => {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic
    homebridge.registerAccessory('homebridge-esp8266-rgb-lights', 'RGBLights', RGBLights)
}

// for testing purposes
if (require.main === module) {
    console.log("starting in stand-alone mode")
    let sal = new Light('Tommy', 18)
}

class RGBLights {
    log: any
    config: any
    name: string
    light: Light
    service: any

    constructor(log: any, config: any) {
        this.log = log
        this.config = config
        this.name = config.name

        this.light = new Light(this.name, 18)

        this.service = new Service.Lightbulb(this.name, 'RGB Strip')
        this.service.getCharacteristic(Characteristic.On)
            .on('set', (v: boolean, cb: () => void) => {
                this.light.turn(v ? "on" : "off")
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: boolean) => void) => {
                cb(null, this.light.state)
            })
        this.service.addCharacteristic(Characteristic.Hue)
            .on('set', (v: number, cb: () => void) => {
                this.light.hue = v
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: number) => void) => {
                cb(null, this.light.hue)
            })
        this.service.addCharacteristic(Characteristic.Brightness)
            .on('set', (v: number, cb: () => void) => {
                this.light.brightness = v
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: number) => void) => {
                cb(null, this.light.brightness)
            })
        this.service.addCharacteristic(Characteristic.Saturation)
            .on('set', (v: number, cb: () => void) => {
                this.light.saturation = v
                cb()
            })
            .on('get', (cb: (arg0: any, arg1: number) => void) => {
                cb(null, this.light.saturation)
            })
    }

    getServices() {
        return [this.service]
    }
}