//A very special bread that falls only a few times in the whole game.
//It falls fast, shines, and gives twice the points of a bottle (+10).
class Bread {
    constructor(ctx) {
        this.ctx = ctx;

        //breads that are falling right now
        this.breads = [];

        //image
        this.img = new Image();
        this.img.src = "images/bread.png"

        //size
        this.width = 76;
        this.height = 40;

        //it falls faster than anything else (the big cat falls at 3.9),
        //but slow enough to see it coming
        this.vy = 5.5;

        //a bread appears the first time the score reaches each of these numbers,
        //so there are only 5 in the whole game
        this.milestones = [20, 55, 80];
        this.next = 0;
    }

    generate(score) {
        if (this.next >= this.milestones.length) return

        if (score >= this.milestones[this.next]) {
            this.spawnAt(Math.floor(Math.random() * (this.ctx.canvas.width - this.width)))

            //if the score is already beyond the following numbers, skip them
            while (this.next < this.milestones.length && this.milestones[this.next] <= score) {
                this.next++
            }
        }
    }

    spawnAt(x) {
        this.breads.push({
            x: x,
            y: -this.height,
            width: this.width,
            height: this.height,
            age: 0
        })
    }

    move() {
        this.breads.forEach(bread => {
            bread.y += this.vy
            bread.age++
        })

        //the ones that reach the floor are lost
        this.breads = this.breads.filter(bread => bread.y < this.ctx.canvas.height)
    }

    draw() {
        this.breads.forEach(bread => {
            const t = bread.age * 0.1
            const cx = bread.x + bread.width / 2
            const cy = bread.y + bread.height / 2

            //a golden trail above the bread, to follow it with the eyes
            const trail = this.ctx.createLinearGradient(0, bread.y - 110, 0, bread.y + 10)
            trail.addColorStop(0, "rgba(255, 220, 90, 0)")
            trail.addColorStop(1, "rgba(255, 220, 90, 0.55)")
            this.ctx.save()
            this.ctx.fillStyle = trail
            this.ctx.fillRect(bread.x + 12, bread.y - 110, bread.width - 24, 120)
            this.ctx.restore()

            //golden halo
            const radius = 70 + 8 * Math.sin(t * 2)
            const halo = this.ctx.createRadialGradient(cx, cy, 5, cx, cy, radius)
            halo.addColorStop(0, "rgba(255, 236, 140, 0.85)")
            halo.addColorStop(0.5, "rgba(255, 210, 70, 0.35)")
            halo.addColorStop(1, "rgba(255, 210, 70, 0)")

            this.ctx.save()
            this.ctx.fillStyle = halo
            this.ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

            //the bread, with a glow
            this.ctx.shadowColor = "rgba(255, 214, 64, 1)"
            this.ctx.shadowBlur = 18 + 8 * Math.sin(t * 2)
            this.ctx.drawImage(this.img, bread.x, bread.y, bread.width, bread.height)
            this.ctx.restore()

            //sparkles turning around the bread
            for (let i = 0; i < 4; i++) {
                const angle = t + i * Math.PI / 2
                const px = cx + Math.cos(angle) * (bread.width * 0.62)
                const py = cy + Math.sin(angle) * (bread.height * 0.95)
                const size = 5 + 4 * Math.abs(Math.sin(t * 3 + i))
                this.drawSparkle(px, py, size)
            }
        })
    }

    drawSparkle(x, y, size) {
        this.ctx.save()
        this.ctx.translate(x, y)
        this.ctx.fillStyle = "rgba(255, 255, 235, 0.95)"
        this.ctx.shadowColor = "rgba(255, 220, 80, 1)"
        this.ctx.shadowBlur = 8
        this.ctx.beginPath()
        //four pointed star
        for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? size : size * 0.28
            const a = i * Math.PI / 4
            this.ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        }
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.restore()
    }

    //removes the breads that touch the dog and returns how many were
    collect(player) {
        const before = this.breads.length

        this.breads = this.breads.filter(bread => !player.collidesWith(bread))

        return before - this.breads.length
    }
}
