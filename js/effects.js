//Small visual effects: points that float up, crumbs of bread and a red flash
//when the dog gets hurt.
class Effects {
    constructor(ctx) {
        this.ctx = ctx;
        this.popups = [];
        this.crumbs = [];
        this.flash = 0;
    }

    //a text that goes up and fades away, like "+2" or "-10"
    popup(text, x, y, color) {
        this.popups.push({ text, x, y, color, age: 0 })
    }

    //crumbs and sparkles jumping out of the dog's mouth
    burstCrumbs(x, y) {
        const colors = ["#e9a94f", "#f6cf7d", "#c47a2b", "#fff1c4", "#ffd54a"]
        for (let i = 0; i < 24; i++) {
            this.crumbs.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 7,
                vy: -1.5 - Math.random() * 5,
                size: 2.5 + Math.random() * 3,
                age: 0,
                life: 28 + Math.random() * 22,
                color: colors[Math.floor(Math.random() * colors.length)]
            })
        }
    }

    //red flash on the whole screen
    damage() {
        this.flash = 1
    }

    update() {
        this.popups.forEach(p => { p.y -= 1.1; p.age++ })
        this.popups = this.popups.filter(p => p.age < 55)

        this.crumbs.forEach(c => {
            c.vy += 0.35
            c.x += c.vx
            c.y += c.vy
            c.age++
        })
        this.crumbs = this.crumbs.filter(c => c.age < c.life)

        this.flash *= 0.9
        if (this.flash < 0.02) this.flash = 0
    }

    draw() {
        const ctx = this.ctx
        ctx.save()

        if (this.flash > 0) {
            ctx.fillStyle = `rgba(255, 30, 30, ${this.flash * 0.3})`
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }

        this.crumbs.forEach(c => {
            ctx.globalAlpha = Math.max(0, 1 - c.age / c.life)
            ctx.fillStyle = c.color
            ctx.fillRect(c.x, c.y, c.size, c.size)
        })

        ctx.globalAlpha = 1
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "bold 30px sans-serif"
        ctx.lineWidth = 5
        ctx.lineJoin = "round"
        this.popups.forEach(p => {
            ctx.globalAlpha = Math.min(1, (55 - p.age) / 20)
            ctx.strokeStyle = "rgba(10, 0, 30, 0.85)"
            ctx.strokeText(p.text, p.x, p.y)
            ctx.fillStyle = p.color
            ctx.fillText(p.text, p.x, p.y)
        })

        ctx.restore()
    }
}
