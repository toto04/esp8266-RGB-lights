let Service, Characteristic

module.exports = (homebridge) => {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic

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
            .on('set', (v) => {
                this.on = v
                console.log(`on: ${v}`)
                this.update()
            })
            .on('get', (cb) => {
                cb(null, this.on)
            })
        this.service.addCharacteristic(Characteristic.Hue)
            .on('set', (v) => {
                this.hue = v
                console.log(`hue: ${v}`)
                this.update()
            })
            .on('get', (cb) => {
                cb(null, this.hue)
            })
        this.service.addCharacteristic(Characteristic.Brightness)
            .on('set', (v) => {
                this.bri = v
                console.log(`bri: ${v}`)
                this.update()
            })
            .on('get', (cb) => {
                cb(null, this.bri)
            })
        this.service.addCharacteristic(Characteristic.Saturation)
            .on('set', (v) => {
                this.sat = v
                console.log(`sat: ${v}`)
                this.update()
            })
            .on('get', (cb) => {
                cb(null, this.sat)
            })
    }

    update() {
        console.log('values updated')
    }

    getServices() {
        return [this.service]
    }
}