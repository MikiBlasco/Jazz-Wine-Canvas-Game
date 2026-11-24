//A hidden tutorial at the beginning of the first screen.
//Instead of random things, the first objects fall one by one in a fixed order,
//so the player learns by playing:
//  2 glasses -> 2 normal cats -> 2 big cats -> 2 running cats -> a bottle -> the golden bread
//While it lasts the dog cannot die (the score never goes below 3).
class Tutorial {
    constructor() {
        this.active = true
        this.ticks = 0
        this.next = 0

        //frames (60 per second) after the start of the game
        this.events = [
            { at: 90,   run: game => this.dropGlass(game) },
            { at: 270,  run: game => this.dropGlass(game) },
            { at: 480,  run: game => this.dropCat(game) },
            { at: 660,  run: game => this.dropCat(game) },
            { at: 900,  run: game => this.dropBigCat(game) },
            { at: 1140, run: game => this.dropBigCat(game) },
            { at: 1380, run: game => this.runCat(game) },
            { at: 1740, run: game => this.runCat(game) },
            { at: 2040, run: game => this.dropBottle(game) },
            { at: 2280, run: game => this.dropBread(game) }
        ]

        //the tutorial ends a bit after the last thing has fallen
        this.endAt = 2280 + 360
    }

    //the objects fall near the dog so it meets them
    nearDog(game, spread, width) {
        const x = game.player.x + game.player.width / 2 + (Math.random() - 0.5) * spread * 2 - width / 2
        return Math.max(0, Math.min(game.ctx.canvas.width - width, x))
    }

    dropGlass(game) {
        game.glass.glasses.push(new Glass(game.ctx, this.nearDog(game, 120, 25), -10))
    }

    dropCat(game) {
        game.cat.spawn(game.score, this.nearDog(game, 40, 35))
    }

    dropBigCat(game) {
        game.catNinja.catsN.push(new CatNinja(game.ctx, this.nearDog(game, 15, 95), -10))
    }

    runCat(game) {
        game.runnerCat.spawn(game.player.x + game.player.width / 2)
    }

    dropBottle(game) {
        game.bottleBig.bottlesBig.push(new BottleBig(game.ctx, this.nearDog(game, 100, 48), -10))
    }

    dropBread(game) {
        game.bread.spawnAt(this.nearDog(game, 80, game.bread.width))
        //this bread is the first one of the game: the next ones come at 55 and 80 points
        game.bread.next = 1
    }

    update(game) {
        this.ticks++

        while (this.next < this.events.length && this.ticks >= this.events[this.next].at) {
            this.events[this.next].run(game)
            this.next++
        }

        if (this.ticks >= this.endAt) {
            this.active = false
        }
    }
}
