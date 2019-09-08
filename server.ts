import mosca from 'mosca'
import mqtt, { MqttClient } from 'mqtt'
import convert from 'color-convert'
import express from 'express'
import bodyParser from 'body-parser'
const app = express()

let broker = new mosca.Server({ port: 1883 })
broker.on('clientConnected', (c: { id: any; }) => {
    console.log(`[broker] client connected with id ${c.id}`)
})
let client = mqtt.connect('mqtt://localhost')

app.use(express.text())
app.post('/color', (req, res) => {
    let hsv = convert.hex.hsv(req.body)
    console.log(parseInt(convert.hsv.hex(hsv), 16))
    res.end()
})
app.post('/mode', (req, res) => {
    console.log(`mode: ${req.body}`)
    res.end()
})
app.use(express.static('static'))
app.listen(2480)