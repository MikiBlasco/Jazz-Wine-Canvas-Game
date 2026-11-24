//A cat that runs along the floor, from one side of the canvas to the other.
//The dog has to jump over it. It hurts like the big falling cat (CatNinja):
//same speed, same damage and same frequency.
class RunnerCat {
    constructor(ctx) {
        this.ctx = ctx;

        //cats that are running right now
        this.cats = [];

        //frames since the game started (used to decide when a cat appears)
        this.ticks = 0;

        //image: a sheet with two frames of the run
        this.img = new Image();
        this.img.src = "images/cat-run.png"
        this.frameWidth = 340;
        this.frameHeight = 205;

        //size on the canvas
        this.width = 105;
        this.height = 64;

        //the floor is where the dog's feet are (player y + height)
        this.floor = 490;

        //a bit faster than the big falling cat (3.9), so a simple jump is enough to clear it
        this.speed = 5.2;
    }

    //same score ranges and frequency as CatNinja.generate
    generate(score, dogX) {
        this.ticks++

        if (this.ticks <= 100) return

        let every = 0

        if (score > 30 && score < 50) every = 420
        if (score >= 70 && score < 90) every = 220
        if (score >= 90 && score <= 100) every = 120

        if (every > 0 && this.ticks % every === 0) {
            this.spawn(dogX)
        }
    }

    //it always comes from the side that is farthest from the dog,
    //so it never appears right on top of the dog (if the dog is in the middle, it is random)
    spawn(dogX) {
        const middle = this.ctx.canvas.width / 2
        let fromLeft = Math.random() < 0.5
        if (dogX !== undefined && Math.abs(dogX - middle) > 15) {
            fromLeft = dogX > middle
        }

        this.cats.push({
            x: fromLeft ? -this.width : this.ctx.canvas.width,
            y: this.floor - this.height,
            width: this.width,
            height: this.height,
            direction: fromLeft ? 1 : -1,
            age: 0
        })
    }

    move() {
        this.cats.forEach(cat => {
            cat.x += cat.direction * this.speed * (this.speedMul || 1)
            cat.age++
        })

        //remove the cats that have already crossed the whole canvas
        this.cats = this.cats.filter(cat =>
            cat.x > -this.width - 5 && cat.x < this.ctx.canvas.width + 5)
    }

    draw() {
        this.cats.forEach(cat => {
            //the picture looks to the right: flip it when the cat goes to the left
            const frame = Math.floor(cat.age / 7) % 2

            this.ctx.save()
            if (cat.direction === 1) {
                this.ctx.drawImage(
                    this.img,
                    frame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
                    cat.x, cat.y, cat.width, cat.height
                )
            } else {
                this.ctx.translate(cat.x + cat.width, cat.y)
                this.ctx.scale(-1, 1)
                this.ctx.drawImage(
                    this.img,
                    frame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
                    0, 0, cat.width, cat.height
                )
            }
            this.ctx.restore()
        })
    }

    //removes the cats that touch the dog and returns how many were
    collect(player) {
        const dog = player.groundHitbox()
        const before = this.cats.length

        this.cats = this.cats.filter(cat => {
            //a bit smaller than the picture, so it is not unfair
            const hit = {
                x: cat.x + 20,
                y: cat.y + 16,
                width: cat.width - 40,
                height: cat.height - 16
            }

            const touching =
                dog.x < hit.x + hit.width && dog.x + dog.width > hit.x &&
                dog.y < hit.y + hit.height && dog.y + dog.height > hit.y

            return !touching
        })

        return before - this.cats.length
    }
}
