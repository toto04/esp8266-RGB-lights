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
            try {
                if (typeof handler == 'function')
                    handler();
            } catch (e) { }
        this.handlers = [];
    }
    once(id, h) {
        this.handlers[id] = h;
    }
}

function RGBtoHEX(r, g, b) {
    let hex = ''
    hex += r.toString(16).padStart(2, '0')
    hex += g.toString(16).padStart(2, '0')
    hex += b.toString(16).padStart(2, '0')
    return hex
}

function HEXtoRGB(hex) {
    return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
    }
}

function RGBtoHSV (r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return [
        Math.round(h * 360),
        percentRoundFn(s * 100),
        percentRoundFn(v * 100)
    ]
}