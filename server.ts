import convert from 'color-convert'
import express, { Express } from 'express'
import Ticker from './ticker'
import { EventEmitter } from 'events'

export default class Server extends EventEmitter {
    app: Express
    ticker: Ticker
    constructor() {
        super()
        this.app = express()
        this.ticker = new Ticker(100)

        this.app.use(express.text())
        this.app.post('/color/:id', (req, res) => {
            let hsv = req.body
            this.ticker.once(0, () => {
                this.emit('color', req.params.id, hsv.h, hsv.s, hsv.v)
            })
            res.end()
        })
        this.app.post('/mode', (req, res) => {
            this.emit('mode', req.body)
            res.end()
        })
        this.app.use(express.static('static'))
        this.app.listen(2480)
    }
}