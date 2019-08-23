import mosca from 'mosca'
import mqtt from 'mqtt'
import { Service, Characteristic, CharacteristicEventTypes, CharacteristicValue, CharacteristicSetCallback } from 'hap-nodejs'

export default function (homebridge: any) {
    homebridge.registerAccessory('homebridge-esp8266-rgb-lights', 'RGBLights', RGBLights)
}

class RGBLights {
    service: Service
    log: any
    config: any
    name: string

    hue = 0
    sat = 0
    bri = 0
    on = false

    constructor(log: any, config: any) {
        this.log = log
        this.config = config
        this.name = config.name

        this.service = new Service.Lightbulb(this.name, 'RGBStrip')
        let onchar = this.service.getCharacteristic(Characteristic.On)
        if (onchar) // Cosa non si fa per il typescript, questi si che sono tipi definiti a culo
            onchar
                .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                    this.on = !!value
                    this.update()
                    callback()
                })
                .on(CharacteristicEventTypes.GET, (callback: (e: Error | null, v: boolean) => void) => {
                    callback(null, this.on)
                })
        this.service.addCharacteristic(Characteristic.Hue)
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                if (typeof value == "number") this.hue = value
                this.update()
                callback()
            })
            .on(CharacteristicEventTypes.GET, (callback: (e: Error | null, v: number) => void) => {
                callback(null, this.hue)
            })
        this.service.addCharacteristic(Characteristic.Saturation)
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                if (typeof value == "number") this.sat = value
                this.update()
                callback()
            })
            .on(CharacteristicEventTypes.GET, (callback: (e: Error | null, v: number) => void) => {
                callback(null, this.sat)
            })
        this.service.addCharacteristic(Characteristic.Brightness)
            .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
                if (typeof value == "number") this.bri = value
                this.update()
                callback()
            })
            .on(CharacteristicEventTypes.GET, (callback: (e: Error | null, v: number) => void) => {
                callback(null, this.bri)
            })

    }

    update() {
        console.log(`H: ${this.hue}, S: ${this.sat}, B: ${this.bri}, on: ${this.on}`)
    }

    getServices() {
        return [this.service]
    }
}