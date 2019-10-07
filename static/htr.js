function HSVtoRGB(h, s, v) {
    h /= 360
    s /= 100
    v /= 100
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    let r, g, b
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

class Ticker {
    constructor(time) {
        this.handlers = [];
        this.handlers = [];
        this.interval = setInterval(() => { this.func(); }, time);
    }
    func() {
        for (let handler of this.handlers)
            if (typeof handler == 'function')
                handler();
        this.handlers = [];
    }
    once(id, h) {
        this.handlers[id] = h;
    }
}