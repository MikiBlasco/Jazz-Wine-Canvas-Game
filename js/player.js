class Player {
    constructor(ctx) {

        this.ctx = ctx;

        //size
        this.width = 100;
        this.height = 110;

         //coordinates
        this.x = 510;
        this.y = 380;

        //the ground: the "y" where the dog stands when it is not jumping
        this.groundY = 380;

        //velocity
        this.vx = 0;
        this.vy = 0;

        //jump physics (pixels per frame)
        this.jumpSpeed = 16.5;
        this.gravity = 0.62;

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

    draw() {
        if (this.flipAngle !== 0) {
            //turning around the center of the dog
            this.ctx.save()
            this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
            this.ctx.rotate(this.flipAngle)
            this.ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height)
            this.ctx.restore()
            return
        }

        this.ctx.drawImage(
            this.img,
            this.x,
            this.y,
            this.width,
            this.height
        );
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
