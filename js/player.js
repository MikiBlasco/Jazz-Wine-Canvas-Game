class Player {
    constructor(ctx) {

        this.ctx = ctx;

        //size
        this.width = 100 * SPRITE_SCALE;
        this.height = 110 * SPRITE_SCALE;

         //coordinates
        this.x = 510;
        this.y = 490 - this.height;   // the feet touch the floor (490)

        //the ground: the "y" where the dog stands when it is not jumping
        this.groundY = 490 - this.height;

        //velocity
        this.vx = 0;
        this.vy = 0;

        //jump physics (pixels per frame)
        this.jumpSpeed = 16.5;
        this.gravity = 0.62;

        //hurt: the dog blinks for a moment
        this.hurtFrames = 0;

        //eating the golden bread: a chewing animation
        this.eatFrames = 0;
        this.eatDuration = 44;

        //victory somersault
        this.flipping = false;
        this.flipFrame = 0;
        this.flipAngle = 0;

        //image
        this.img = new Image();
        this.img.src = "images/Jazz-No-border.png"

    }

    isOnGround() {
        return this.y >= this.groundY && this.vy === 0
    }

    jump() {
        //only jump from the ground, so it is not possible to fly
        if (this.isOnGround()) {
            this.vy = -this.jumpSpeed
        }
    }

    move() {
        this.x += this.vx;

        //vertical movement: only while in the air
        if (!this.isOnGround()) {
            this.vy += this.gravity;
            this.y += this.vy;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.vy = 0;
            }
        }
    }

    hurt() {
        this.hurtFrames = 36
    }

    eat() {
        this.eatFrames = this.eatDuration
    }

    draw() {
        const ctx = this.ctx

        //blinking when hurt
        let alpha = 1
        if (this.hurtFrames > 0) {
            this.hurtFrames--
            alpha = Math.floor(this.hurtFrames / 4) % 2 === 0 ? 0.35 : 1
        }

        //chewing: the dog gets wider and shorter three times, with a golden glow
        let scaleX = 1, scaleY = 1, glow = 0
        if (this.eatFrames > 0) {
            const t = (this.eatDuration - this.eatFrames) / this.eatDuration
            const pulse = Math.sin(t * Math.PI * 6)
            scaleX = 1 + 0.10 * pulse
            scaleY = 1 - 0.12 * pulse
            glow = 1 - t
            this.eatFrames--
        }

        ctx.save()
        ctx.globalAlpha = alpha

        if (glow > 0) {
            const cx = this.x + this.width / 2
            const cy = this.y + this.height / 2
            const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95)
            aura.addColorStop(0, `rgba(255, 224, 110, ${0.75 * glow})`)
            aura.addColorStop(1, "rgba(255, 224, 110, 0)")
            ctx.fillStyle = aura
            ctx.fillRect(cx - 95, cy - 95, 190, 190)
        }

        if (this.flipAngle !== 0) {
            //turning around the center of the dog
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
            ctx.rotate(this.flipAngle)
            ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height)
        } else {
            //the dog is scaled from its feet
            ctx.translate(this.x + this.width / 2, this.y + this.height)
            ctx.scale(scaleX, scaleY)
            ctx.drawImage(this.img, -this.width / 2, -this.height, this.width, this.height)
        }

        ctx.restore()
    }

    //A jump with a full forward somersault (the dog looks to the left,
    //so it turns counterclockwise).
    startFlip() {
        this.flipping = true
        this.flipFrame = 0
        this.vx = 0
        this.vy = -this.jumpSpeed
    }

    //moves the dog one frame during the somersault. Returns true when it lands.
    updateFlip() {
        if (!this.flipping) return true

        this.flipFrame++
        this.vy += this.gravity
        this.y += this.vy

        //the turn follows the time in the air (smooth start and end)
        const airTime = 2 * this.jumpSpeed / this.gravity
        const p = Math.min(1, this.flipFrame / airTime)
        this.flipAngle = -2 * Math.PI * (p * p * (3 - 2 * p))

        if (this.y >= this.groundY) {
            this.y = this.groundY
            this.vy = 0
            this.flipping = false
            this.flipAngle = 0
            return true
        }
        return false
    }

    collidesWith(object) {

        if (this.x < object.x + object.width && this.x + this.width > object.x &&
            this.y < object.y + object.height && this.y + this.width > object.y) {
                return true
            }

    }

    //Area of the dog that can be hit by something running on the floor:
    //the legs and hips, which are on the lower right of the picture.
    //(the lower left corner of the picture is empty, so cats pass under it)
    groundHitbox() {
        return {
            x: this.x + this.width * 0.43,
            y: this.y + this.height * 0.62,
            width: this.width * 0.47,
            height: this.height * 0.38
        }
    }

    exitsCanvas() {
        if (this.x > this.ctx.canvas.width) {
            this.x = -50
        }
        if (this.x + this.width < 0) {
            this.x = this.ctx.canvas.width
        }
    }
}
