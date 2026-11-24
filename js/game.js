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
    }

    start(){
        this.play()
    }

    play(){

        if(this.frameNumber !== null) {
            this.frameNumber = requestAnimationFrame(this.play.bind(this));
        }

        this.tick()
    }

    //everything that happens in one frame
    tick(){
        this.ticks++

        if (this.winning) {
            this.playWin()
            return
        }

        this.draw();
        this.move();
        this.updateScore();
        this.generateSecondarys();
        this.checkCollisions();
        this.destroySecondarys();               
        this.drawScore();
        this.drawLevel(); 
        this.drawProgressBar();
        this.drawDanger();
        this.effects.update();
        this.effects.draw();
        this.background.backgroundChange(this.score);
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

        this.cat.generate(this.score, this.frameNumber)
        this.catNinja.generate(this.score, this.frameNumber)
        this.glass.generate(this.frameNumber)
        this.bottleBig.generate(this.score, this.frameNumber)
        this.runnerCat.generate(this.score)
        this.bread.generate(this.score)
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
    
    drawLevel(){
        //score Level
        if(this.score > 50 && this.score <=80) {  

        this.text = ctx.fillText(`${this.score} points`, this.x, this.y)
        this.text = ctx.fillText(`Level 2`, 700, this.y)   
    
        } else if (this.score > 80 && this.score <=100) {      
        this.text = ctx.fillText(`${this.score} points`, this.x, this.y)
        this.text = ctx.fillText(`Level 3`, 700, this.y)
    
        } else {
        this.text = ctx.fillText(`${this.score} points`, this.x, this.y)
        this.text = ctx.fillText(`Level 1`, 700, this.y)
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
   
        if(this.score <= 0) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.font = "bold 32px sans-serif";
            this.ctx.fillText(
              "Game Over",
              this.ctx.canvas.width / 2,
              this.ctx.canvas.height / 2
            );
            this.stop()
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
        this.drawLevel()
        this.drawProgressBar()

        //a short pause after landing, then the message
        if (landed) {
            this.landedFrames++
        }

        if (this.landedFrames > 40) {
            this.ctx.save()
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
            this.ctx.fillStyle = "white"
            this.ctx.textAlign = "center"
            this.ctx.font = "bold 50px sans-serif"
            this.ctx.fillText(
              `YOU WIN!`,
              this.ctx.canvas.width / 2,
              this.ctx.canvas.height / 2
            )
            this.ctx.restore()
            this.stop()
        }
    }

    //-------------------------------------------------------------- progress bar
    //The score is also the life of the dog. The bar goes from a skull (0 points:
    //game over) to a star (100 points: you win). Near the skull the bar turns red
    //and pulses, so it is clear how close the dog is to losing.
    drawProgressBar(){
        const ctx = this.ctx
        const x = 84, y = 14, w = 696, h = 18, r = 9
        const goal = 100

        //it moves smoothly instead of jumping
        const target = Math.max(0, Math.min(goal, this.score))
        this.displayScore += (target - this.displayScore) * 0.12
        if (Math.abs(target - this.displayScore) < 0.05) this.displayScore = target
        const progress = this.displayScore / goal

        //0 when the dog is safe, 1 when it is about to die
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

        //empty bar
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

        //full part: from wine red to gold
        if (progress > 0) {
            ctx.save()
            roundRect(x, y, w, h, r)
            ctx.clip()
            const fillWidth = w * progress
            const gradient = ctx.createLinearGradient(x, 0, x + w, 0)
            gradient.addColorStop(0, "#a3123a")
            gradient.addColorStop(0.6, "#ff9a3c")
            gradient.addColorStop(1, "#ffd54a")
            ctx.fillStyle = gradient
            ctx.fillRect(x, y, fillWidth, h)
            //light on the upper half
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)"
            ctx.fillRect(x, y, fillWidth, h / 2)
            ctx.restore()
        }

        //marks where each screen starts (40, 70 and 80 points)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)"
        ctx.lineWidth = 2
        ;[40, 70, 80].forEach(mark => {
            const mx = x + w * mark / goal
            ctx.beginPath()
            ctx.moveTo(mx, y + 3)
            ctx.lineTo(mx, y + h - 3)
            ctx.stroke()
        })

        //border (it pulses red when the dog is in danger)
        roundRect(x, y, w, h, r)
        ctx.strokeStyle = danger > 0
            ? `rgba(255, ${Math.round(255 - 190 * danger * pulse)}, ${Math.round(255 - 190 * danger * pulse)}, 0.95)`
            : "rgba(255, 255, 255, 0.85)"
        ctx.lineWidth = 2 + 1.5 * danger * pulse
        ctx.stroke()

        //left end: a skull (this is where you lose)
        this.drawSkull(52, y + h / 2, danger, pulse)

        //right end: a star and the number 100 (this is where you win)
        const sx = x + w + 26, sy = y + h / 2
        ctx.fillStyle = progress >= 0.8 ? "#ffd54a" : "rgba(255, 255, 255, 0.85)"
        ctx.strokeStyle = "#3a2a00"
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < 10; i++) {
            const rad = i % 2 === 0 ? 13 : 5.5
            const a = -Math.PI / 2 + i * Math.PI / 5
            ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.font = "bold 20px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "white"
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
        ctx.shadowBlur = 4
        ctx.fillText("100", sx + 20, sy + 1)

        ctx.restore()
    }

    //a small skull; it gets red and shakes when the dog is about to die
    drawSkull(cx, cy, danger, pulse){
        const ctx = this.ctx
        ctx.save()
        ctx.translate(cx + (danger > 0.3 ? Math.sin(this.ticks * 1.7) * 1.5 * danger : 0), cy)
        const s = 1 + 0.18 * danger * pulse
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
