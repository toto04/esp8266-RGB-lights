import Light, { Mode } from './lights'
import mqtt, { MqttClient } from 'mqtt'
import mosca from 'mosca'
import express from 'express'
import Datastore from 'nedb'
let app = express()
let db = new Datastore({ filename: __dirname + '/presets.db' })
db.loadDatabase()
let Service: any, Characteristic: any

let lights: Light[] = []

let broker = new mosca.Server({ port: 1883 })
broker.on('clientConnected', (c: { id: any; }) => {
    console.log(`[broker] connected client: ${c.id}`)
})
// broker.on('published', (packet) => {
//     console.log(packet.topic, packet.payload)
// })
let client = mqtt.connect('mqtt://localhost')

app.use(express.text())
app.get('/api/', (req, res) => {
    let response = {}
    for (let light of lights) response[light.name] = light.toObject()
    res.send(JSON.stringify(response))
})
app.get('/api/presets/:light', (req, res) => {
    db.find({ light: req.params.light }, (err, docs) => {
        if (err) throw err
        res.status(200).send(docs.map(e => ({ name: e.name, state: e.state })))
    })
})
app.post('/api/presets/:light', (req, res) => {
    let light = lights.find(l => l.name == req.params.light)
    if (light) {
        db.update({name: req.body}, {light: light.name, name: req.body, state: light.toObject()}, {upsert: true}, () => res.send({success: true}))
    } else { res.send({ success: false }) }
})
app.route('/api/:light')
    .get((req, res) => {
        res.send(JSON.stringify(lights.find(l => l.name == req.params.light).toObject()))
    })
    .post((req, res) => {
        if (req.body == 'on' || req.body == 'off') {
            lights.find(l => l.name == req.params.light).turn(req.body)
        }
        res.end()
    })
app.post('/api/:light/:strip/:pixel', (req, res) => {
    let hsv = JSON.parse(req.body)
    let light = lights.find(l => l.name == req.params.light)
    light.strips[parseInt(req.params.strip)][parseInt(req.params.pixel)].set(hsv.h, hsv.s, hsv.v)
    res.end()
})
app.post('/api/:light/mode', (req, res) => {
    let light = lights.find(l => l.name == req.params.light)
    light.setMode(Mode[String(req.body)])
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
    lights = [
        new Light('tommaso', 18)
    ]
}

for (let light of lights) {
    light.on('update', buf => {
        if (buf instanceof Buffer) client.publish(light.name, buf)
    })
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

        this.light = new (Function.prototype.bind.apply(Light, [null, this.config.name].concat(this.config.strips)))()
        this.light.on('update', (buf: Buffer) => {
            client.publish(this.name, buf)
        })
        lights.push(this.light)

        this.service = new Service.Lightbulb(this.name, this.name)
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
