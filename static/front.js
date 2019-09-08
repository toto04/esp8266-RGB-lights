var convert = require('color-convert')
let mode = document.querySelector('#mode')
mode.addEventListener('change', () => {
    fetch('/mode', {
        method: 'post',
        body: mode.value
    })
})

let slider = document.querySelector('#slider')
slider.addEventListener('input', () => {
    updateWheel()
})
let pickEl = document.querySelector('#picker')
let picker = pickEl.getContext('2d')
let down = false
pickEl.addEventListener('mousedown', () => down = true)
pickEl.addEventListener('mouseup', () => down = false)
pickEl.addEventListener('mousemove', (e) => {
    if (down) {
        let x = e.x - pickEl.offsetLeft
        let y = e.y - pickEl.offsetTop
        let hex = convert.hsv.hex(getHSV(x, y))
        
    }
})
updateWheel()

function updateWheel() {
    for (let x = 0; x < 250; x++) {
        for (let y = 0; y < 250; y++) {
            let HSV = getHSV(x, y)
            if (!HSV) continue
            let rgb = convert.hsv.rgb(HSV)
            picker.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
            picker.fillRect(x, y, 1, 1)
        }
    }
}

function getHSV(x, y) {
    let cx = x - 125
    let cy = y - 125
    let hue = Math.round(Math.atan2(cy, cx) / Math.PI * 180) + 180
    let sat = Math.sqrt(cx * cx + cy * cy)
    if (sat > 125) return
    sat = Math.round(sat / 1.25)
    return [hue, sat, slider.value]
}