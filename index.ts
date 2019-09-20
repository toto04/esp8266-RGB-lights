import Light from './lights'
let Service: any, Characteristic: any

export default (homebridge: any) => {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic
    homebridge.registerAccessory('homebridge-esp8266-rgb-lights', 'RGBLights', RGBLights)
}

// for testing purposes
if (require.main === module) {
    console.log("starting in stand-alone mode")
    let sal = new Light(18)
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

        this.light = new Light(18)

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