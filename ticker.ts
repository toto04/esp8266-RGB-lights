export default class Ticker {
    interval: NodeJS.Timeout
    private handlers: { (...args: any): any }[] = []
    constructor(time: number) {
        this.handlers = []
        this.interval = setInterval(() => { this.func() }, time)
    }

    private func() {
        for (let handler of this.handlers) if (typeof handler == 'function') handler()
        this.handlers = []
    }

    once(id: number, h: (...args: any) => any) {
        this.handlers[id] = h
    }
}