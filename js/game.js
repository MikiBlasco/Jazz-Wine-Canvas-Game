class Game {
    constructor(ctx, player, glass, bottleBig, cat, catNinja, background, runnerCat, bread) {
        this.ctx = ctx;
        this.player = player;
        this.glass = glass;
        this.bottleBig = bottleBig;
        this.cat = cat;
        this.catNinja = catNinja;
        this.background = background;
        this.runnerCat = runnerCat;
        this.bread = bread;
        this.frameNumber = 0;

        //fixed 60 steps per second, whatever the refresh rate of the screen (60, 90, 120 Hz...)
        this.clock = 0          // steps since the start (used to time the spawns)
        this.lastTime = null
        this.accumulated = 0
        this.paused = false
        this.x;
        this.y;
        this.score = 10

        //progress bar (it fills smoothly towards the score)
        this.displayScore = this.score

        //victory sequence
        this.winning = false
        this.winFrames = 0

        //floating points, crumbs and flashes
        this.effects = new Effects(ctx)

        //hidden tutorial in the first screen
        this.tutorial = new Tutorial()

        //frames since the start (for the pulsing effects)
        this.ticks = 0

        //levels only go forward: 1 (0+), 2 (40+), 3 (70+), 4 (80+)
        this.levelStarts = [0, 40, 70, 80]
        this.level = 1
        this.levelFlash = 0

        //every level has a clock (in seconds). If it runs out, the dog loses.
        //Reaching the next level gives the full time of that level.
        this.levelTimes = [100, 90, 50, 80]
        this.timeLeft = this.levelTimes[0] * 60   // in frames (60 per second)
        this.displayTime = 1                      // 0 to 1, smooth version for the bar
        this.timeUp = false

        //the closer the clock is to the end, the faster things fall (up to +35%)
        this.maxExtraSpeed = 0.35
    }

    levelTotalFrames(){
        return this.levelTimes[this.level - 1] * 60
    }

    //0 to 1: how much pressure the clock has built up (it starts after 40% of the time)
    pressure(){
        const used = 1 - this.timeLeft / this.levelTotalFrames()
        return Math.max(0, Math.min(1, (used - 0.4) / 0.6))
    }

    //score used for the difficulty and the background: it never goes below the start of the level reached
    effectiveScore(){
        return Math.max(this.score, this.levelStarts[this.level - 1])
    }

    updateLevel(){
        if (this.tutorial.active) return

        //only advance, never go back
        let reached = this.level
        this.levelStarts.forEach((start, i) => {
            if (this.score >= start && i + 1 > reached) reached = i + 1
        })

        if (reached > this.level) {
            this.level = reached
            this.timeLeft = this.levelTotalFrames()   // the clock is full again
            this.levelFlash = 90
            this.effects.popup(`LEVEL ${this.level}`, this.ctx.canvas.width / 2, 150, "#ffd54a")
        } else {
            this.timeLeft--
            if (this.timeLeft <= 0) {
                this.timeLeft = 0
                this.timeUp = true
            }
        }

        const mul = 1 + this.maxExtraSpeed * this.pressure()
        ;[this.glass, this.bottleBig, this.cat, this.catNinja, this.runnerCat].forEach(o => o.speedMul = mul)
    }

    start(){
        this.play()
    }

    play(timestamp){

        if(this.frameNumber !== null) {
            this.frameNumber = requestAnimationFrame(this.play.bind(this));
        }

        this.advance(timestamp === undefined ? performance.now() : timestamp)
    }

    //runs as many fixed steps (1/60 s) as the real time asks for; returns how many it ran
    advance(timestamp){
        const step = 1000 / 60

        if (this.lastTime === null || this.paused) {
            this.lastTime = timestamp
            return 0
        }

        //after a pause or a hidden tab there is no jump forward
        this.accumulated += Math.min(timestamp - this.lastTime, 100)
        this.lastTime = timestamp

        let steps = 0
        while (this.accumulated >= step - 2 && steps < 3) {
            this.accumulated = Math.max(0, this.accumulated - step)
            steps++
            this.tick()
            if (this.frameNumber === null) break
        }
        return steps
    }

    //everything that happens in one frame
    tick(){
        this.ticks++
        this.clock++

        if (this.winning) {
            this.playWin()
            return
        }

        this.draw();
        this.move();
        this.updateScore();
        this.updateLevel();
        this.generateSecondarys();
        this.checkCollisions();
        this.destroySecondarys();               
        this.drawScore();
        this.drawProgressBar();
        this.drawDanger();
        this.effects.update();
        this.effects.draw();
        this.background.backgroundChange(this.effectiveScore());
        this.GameOver();       
    }

    stop(){
        cancelAnimationFrame(this.frameNumber);
        this.frameNumber = null; 

        
    
    }

    generateSecondarys(){
        //at the beginning the tutorial decides what falls
        if (this.tutorial.active) {
            this.tutorial.update(this)
            return
        }

        this.cat.generate(this.effectiveScore(), this.clock)
        this.catNinja.generate(this.effectiveScore(), this.clock)
        this.glass.generate(this.clock)
        this.bottleBig.generate(this.effectiveScore(), this.clock)
        this.runnerCat.generate(this.effectiveScore(), this.player.x + this.player.width / 2)
        this.bread.generate(this.effectiveScore())
    }
 
    destroySecondarys(){
        this.cat.destroy();
        this.catNinja.destroy();
        this.glass.destroy();
        this.bottleBig.destroy()
    }

    move(){
        this.player.move(),
        this.player.exitsCanvas(),
        this.glass.move(),
        this.bottleBig.move()
        this.catNinja.move(this.catsN),
        this.cat.move()
        this.runnerCat.move()
        this.bread.move()
    }

    draw(){
        this.ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.background.draw(),
        this.glass.draw(),        
        this.cat.draw(),
        this.catNinja.draw(this.catsN),
        this.bottleBig.draw(),
        this.runnerCat.draw(),
        this.bread.draw(),
        this.player.draw()         
        //this.score.draw()  
    }

    checkCollisions(){
        this.cat.checkCollision(this.collision);
        this.catNinja.checkCollision(this.pain);
        this.glass.checkCollision(this.reward);
        this.bottleBig.checkCollision(this.rewardBig)
    }
    
    updateScore(){

        const before = this.score
        let ateBread = false
        
        if (this.glass.checkCollision() === true){ 
            this.score += 2
            glass2.play()
            glass3.play()        
        }

        if (this.cat.checkCollision() === true){ 
            this.score -= 1
            cat1.play()
            cat2.play()
        }
        if (this.bottleBig.checkCollision()=== true) { 
            this.score += 5
            bigBottle1.play()
            bigBottle2.play()
            bigBottle4.play()
            bigBottle5.play()
            bigBottle6.play()
        }
        if (this.catNinja.checkCollision()=== true) { 
            this.score -= 10
            ninjaCat1.play()
            ninjaCat2.play()
            cat1.play()
            cat2.play()
        }

        //cat running on the floor: same damage as the big cat
        if (this.runnerCat.collect(this.player) > 0) {
            this.score -= 10
            ninjaCat1.play()
            ninjaCat2.play()
            cat1.play()
            cat2.play()
        }

        //special bread: twice the points of a bottle
        if (this.bread.collect(this.player) > 0) {
            this.score += 10
            ateBread = true
            bigBottle5.play()
            bigBottle6.play()
        }

        //in the tutorial the dog cannot die
        if (this.tutorial.active && this.score < 3) {
            this.score = 3
        }

        this.showScoreChange(this.score - before, ateBread)
    }

    //points that float over the dog, a flash when it is hurt, and the bread animation
    showScoreChange(change, ateBread){
        if (change === 0) return

        const dogX = this.player.x + this.player.width / 2
        const dogY = this.player.y - 6

        if (ateBread) {
            this.player.eat()
            this.effects.burstCrumbs(this.player.x + this.player.width * 0.25, this.player.y + this.player.height * 0.35)
            this.effects.popup("Yum! +10", dogX, dogY - 14, "#ffd54a")
        } else if (change > 0) {
            this.effects.popup(`+${change}`, dogX, dogY, "#7dff8a")
        } else {
            this.effects.popup(`${change}`, dogX, dogY, "#ff6b6b")
            this.effects.damage()
            this.player.hurt()
        }
    }
    
    drawScore(){        
        //score Number        
        if (this.score >= 0 && this.score < 100) {

        if(this.score >= 100) this.score = 100

          this.x = 40;
          this.y = 70;
          this.width = 100;
          this.height = 50;

          if (this.score <=5)  this.ctx.fillStyle = "red"
          if (this.score > 5 && this.score < 80)  this.ctx.fillStyle = "#0b0025";
          if (this.score >=80) this.ctx.fillStyle ="green"

    
        this.ctx.font = " bold 40px sans-serif"        
      }
        
    };

    GameOver(){
   
        if(this.score <= 0 || this.timeUp) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "#ff6b6b";
            this.ctx.font = "bold 52px sans-serif";
            this.ctx.fillText(this.timeUp ? "Time's up!" : "Game Over", this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 - 20);
            this.ctx.fillStyle = "white";
            this.ctx.font = "22px sans-serif";
            this.ctx.fillText(`You reached level ${this.level}`, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 24);
            this.stop()
            if (typeof onGameEnd === "function") onGameEnd("lose")
          }

        if(this.score >= 100) {
            this.startWin()
        }
    }

    
    //-------------------------------------------------------------- victory
    startWin(){
        this.winning = true
        this.winFrames = 0
        this.landedFrames = 0
        this.flipStarted = false
        this.score = 100
        this.player.vx = 0

        //the screen calms down: nothing else falls or runs
        this.glass.glasses = []
        this.bottleBig.bottlesBig = []
        this.cat.cats = []
        this.catNinja.catsN = []
        this.runnerCat.cats = []
        this.bread.breads = []

        final.pause()
        win.play()
    }

    playWin(){
        this.winFrames++

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.background.draw()

        //if the dog is still in the air, it lands first; then it does the somersault
        let landed = false
        if (!this.flipStarted) {
            if (this.player.isOnGround()) {
                this.player.startFlip()
                this.flipStarted = true
            } else {
                this.player.move()
            }
        } else {
            landed = this.player.updateFlip()
        }
        this.player.draw()

        this.drawScore()
        this.drawProgressBar()

        //a short pause after landing, then the message
        if (landed) {
            this.landedFrames++
        }

        if (this.landedFrames > 40) {
            this.ctx.save()
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
            this.ctx.textAlign = "center"
            this.ctx.fillStyle = "#ffd54a"
            this.ctx.font = "bold 60px sans-serif"
            this.ctx.fillText(`YOU WIN!`, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 - 20)
            this.ctx.fillStyle = "white"
            this.ctx.font = "22px sans-serif"
            this.ctx.fillText("Jazz caught all the wine!", this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 24)
            this.ctx.restore()
            this.stop()
            if (typeof onGameEnd === "function") onGameEnd("win")
        }
    }

    //-------------------------------------------------------------- bars at the top
    //Top bar: the life of the dog. The score goes from a skull (0 points: game over)
    //to a star (100 points: you win). Near the skull the bar turns red and pulses.
    //Bottom bar: the clock of the level. It empties little by little; if it runs out you lose.
    //The badge on the left is the level.
    drawProgressBar(){
        const ctx = this.ctx
        const x = 96, w = 684, r = 7
        const y = 10, h = 14          // life bar
        const y2 = 32, h2 = 12        // clock bar
        const goal = 100

        //it moves smoothly instead of jumping
        const target = Math.max(0, Math.min(goal, this.score))
        this.displayScore += (target - this.displayScore) * 0.12
        if (Math.abs(target - this.displayScore) < 0.05) this.displayScore = target
        const progress = this.displayScore / goal

        const danger = this.dangerLevel()
        const pulse = 0.5 + 0.5 * Math.sin(this.ticks * 0.25)

        const roundRect = (rx, ry, rw, rh, rr) => {
            ctx.beginPath()
            ctx.moveTo(rx + rr, ry)
            ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rr)
            ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rr)
            ctx.arcTo(rx, ry + rh, rx, ry, rr)
            ctx.arcTo(rx, ry, rx + rw, ry, rr)
            ctx.closePath()
        }

        ctx.save()

        //---------------- life bar
        roundRect(x, y, w, h, r)
        ctx.fillStyle = "rgba(10, 0, 30, 0.5)"
        ctx.fill()

        //danger zone: the first 15 points are tinted red
        ctx.save()
        roundRect(x, y, w, h, r)
        ctx.clip()
        ctx.fillStyle = `rgba(255, 40, 40, ${0.22 + 0.25 * danger * pulse})`
        ctx.fillRect(x, y, w * 15 / goal, h)
        ctx.restore()

        if (progress > 0) {
            ctx.save()
            roundRect(x, y, w, h, r)
            ctx.clip()
            const gradient = ctx.createLinearGradient(x, 0, x + w, 0)
            gradient.addColorStop(0, "#a3123a")
            gradient.addColorStop(0.6, "#ff9a3c")
            gradient.addColorStop(1, "#ffd54a")
            ctx.fillStyle = gradient
            ctx.fillRect(x, y, w * progress, h)
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)"
            ctx.fillRect(x, y, w * progress, h / 2)
            ctx.restore()
        }

        //marks where each level starts (40, 70 and 80 points)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)"
        ctx.lineWidth = 2
        ;[40, 70, 80].forEach(mark => {
            const mx = x + w * mark / goal
            ctx.beginPath()
            ctx.moveTo(mx, y + 2)
            ctx.lineTo(mx, y + h - 2)
            ctx.stroke()
        })

        roundRect(x, y, w, h, r)
        ctx.strokeStyle = danger > 0
            ? `rgba(255, ${Math.round(255 - 190 * danger * pulse)}, ${Math.round(255 - 190 * danger * pulse)}, 0.95)`
            : "rgba(255, 255, 255, 0.85)"
        ctx.lineWidth = 2 + 1.5 * danger * pulse
        ctx.stroke()

        this.drawSkull(66, y + h / 2, danger, pulse)

        //right end: a star and the number 100
        const sx = x + w + 20, sy = y + h / 2
        ctx.fillStyle = progress >= 0.8 ? "#ffd54a" : "rgba(255, 255, 255, 0.85)"
        ctx.strokeStyle = "#3a2a00"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let i = 0; i < 10; i++) {
            const rad = i % 2 === 0 ? 11 : 4.5
            const a = -Math.PI / 2 + i * Math.PI / 5
            ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.font = "bold 17px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "white"
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
        ctx.shadowBlur = 4
        ctx.fillText("100", sx + 16, sy + 1)
        ctx.shadowBlur = 0

        //---------------- clock bar
        const total = this.levelTotalFrames()
        const fraction = Math.max(0, Math.min(1, this.timeLeft / total))
        //it empties smoothly, and refills fast when a new level starts
        this.displayTime += (fraction - this.displayTime) * (fraction > this.displayTime ? 0.15 : 0.5)
        if (Math.abs(fraction - this.displayTime) < 0.002) this.displayTime = fraction

        const seconds = Math.ceil(this.timeLeft / 60)
        const low = fraction < 0.25
        const mid = fraction < 0.5
        const clockPulse = low ? 0.5 + 0.5 * Math.sin(this.ticks * 0.3) : 0
        const barColor = low ? "#ff4d4d" : mid ? "#ffb347" : "#5ec8ff"

        roundRect(x, y2, w, h2, 6)
        ctx.fillStyle = "rgba(10, 0, 30, 0.5)"
        ctx.fill()

        if (this.displayTime > 0) {
            ctx.save()
            roundRect(x, y2, w, h2, 6)
            ctx.clip()
            ctx.fillStyle = barColor
            ctx.fillRect(x, y2, w * this.displayTime, h2)
            ctx.fillStyle = "rgba(255, 255, 255, 0.28)"
            ctx.fillRect(x, y2, w * this.displayTime, h2 / 2)
            ctx.restore()
        }

        roundRect(x, y2, w, h2, 6)
        ctx.strokeStyle = low
            ? `rgba(255, ${Math.round(255 - 190 * clockPulse)}, ${Math.round(255 - 190 * clockPulse)}, 0.95)`
            : "rgba(255, 255, 255, 0.8)"
        ctx.lineWidth = 1.8 + 1.5 * clockPulse
        ctx.stroke()

        //little clock on the left
        const cx = 66, cy = y2 + h2 / 2
        ctx.beginPath()
        ctx.arc(cx, cy, 9, 0, Math.PI * 2)
        ctx.fillStyle = "#f4f0e8"
        ctx.fill()
        ctx.strokeStyle = low ? "#ff4d4d" : "#2a1010"
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx, cy - 6)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx + 4, cy + 2)
        ctx.strokeStyle = "#2a1010"
        ctx.lineWidth = 1.6
        ctx.stroke()

        //time left (minutes:seconds)
        const mm = Math.floor(seconds / 60), ss = String(seconds % 60).padStart(2, "0")
        ctx.font = "bold 17px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.fillStyle = low ? "#ff8080" : "white"
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
        ctx.shadowBlur = 4
        ctx.fillText(`${mm}:${ss}`, x + w + 10, cy + 1)

        ctx.restore()

        this.drawLevelBadge(30, 27)
    }

    //round badge with the level number (it flashes when you reach a new level)
    drawLevelBadge(cx, cy){
        const ctx = this.ctx
        const flash = this.levelFlash > 0 ? this.levelFlash-- / 90 : 0
        ctx.save()
        ctx.translate(cx, cy)
        const s = 1 + 0.35 * flash * Math.abs(Math.sin(flash * 12))
        ctx.scale(s, s)

        if (flash > 0) {
            ctx.beginPath()
            ctx.arc(0, 0, 15 + 12 * (1 - flash), 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(255, 213, 74, ${flash})`
            ctx.lineWidth = 3
            ctx.stroke()
        }

        const g = ctx.createLinearGradient(0, -16, 0, 16)
        g.addColorStop(0, "#ffe27a")
        g.addColorStop(1, "#c4781a")
        ctx.beginPath()
        ctx.arc(0, 0, 16, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.lineWidth = 2.5
        ctx.strokeStyle = "#3a1a00"
        ctx.stroke()

        ctx.font = "bold 20px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#2a0f00"
        ctx.fillText(String(this.level), 0, 1)
        ctx.restore()
    }

    //a small skull; it gets red and shakes when the dog is about to die
    drawSkull(cx, cy, danger, pulse){
        const ctx = this.ctx
        ctx.save()
        ctx.translate(cx + (danger > 0.3 ? Math.sin(this.ticks * 1.7) * 1.5 * danger : 0), cy)
        const s = 0.8 * (1 + 0.18 * danger * pulse)
        ctx.scale(s, s)

        ctx.fillStyle = danger > 0 ? `rgb(255, ${Math.round(245 - 150 * danger)}, ${Math.round(235 - 160 * danger)})` : "#f4f0e8"
        ctx.strokeStyle = "#2a1010"
        ctx.lineWidth = 2

        //head and jaw
        ctx.beginPath()
        ctx.arc(0, -2, 11, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.rect(-6, 6, 12, 7)
        ctx.fill()
        ctx.stroke()

        //eyes and nose
        ctx.fillStyle = "#2a1010"
        ctx.beginPath()
        ctx.arc(-4.5, -3, 3, 0, Math.PI * 2)
        ctx.arc(4.5, -3, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(0, 1)
        ctx.lineTo(-1.8, 4.5)
        ctx.lineTo(1.8, 4.5)
        ctx.closePath()
        ctx.fill()

        //teeth
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(-2, 6); ctx.lineTo(-2, 13)
        ctx.moveTo(2, 6); ctx.lineTo(2, 13)
        ctx.stroke()

        ctx.restore()
    }

    //how close the dog is to dying: 0 above 15 points, 1 at 0 points
    dangerLevel(){
        return Math.max(0, Math.min(1, (15 - this.displayScore) / 15))
    }

    //red glow around the screen when the dog is in danger
    drawDanger(){
        const danger = this.dangerLevel()
        if (danger <= 0) return

        const ctx = this.ctx
        const w = ctx.canvas.width, h = ctx.canvas.height
        const pulse = 0.65 + 0.35 * Math.sin(this.ticks * 0.15)

        ctx.save()
        const glow = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 1.0)
        glow.addColorStop(0, "rgba(200, 0, 0, 0)")
        glow.addColorStop(1, `rgba(200, 0, 0, ${0.62 * danger * pulse})`)
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, w, h)
        ctx.restore()
    }
}
