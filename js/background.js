class Background {
    constructor(ctx){
        this.ctx = ctx;
        //size of the background covering all canvas size
        this.width = ctx.canvas.width;
        this.height = ctx.canvas.height;

        //position of the background image
        this.x = 0;
        this.y = 0;

        //all the backgrounds are loaded once, when the page starts.
        //Creating a new Image on every frame left the canvas empty for a moment
        //(and showed what was behind it) every time the background changed.
        this.images = {
            foggy:   this.loadImage("images/background foggy.png"),
            night:   this.loadImage("images/background night.png"),
            bad:     this.loadImage("images/background bad.png"),
            sweet:   this.loadImage("images/background sweet.jpg"),
            fantasy: this.loadImage("images/background fantasy1.jpg")
        }

        this.current = "night"
        this.img = this.images.night
        this.lastReady = null

        //music: only one song can be playing at a time.
        //(the audio objects are created later in index.js, so they are looked up when first needed)
        this.tracks = null
        this.currentTrack = null
    }

    getTracks() {
        if (!this.tracks) {
            this.tracks = {
                foggy:   main1,
                night:   main1,
                bad:     main2,
                sweet:   main3,
                fantasy: final
            }
            Object.values(this.tracks).forEach(track => track.loop = true)
        }
        return this.tracks
    }

    loadImage(src) {
        const img = new Image()
        img.src = src
        return img
    }

    draw() {
        //if the new background is still loading, keep showing the previous one
        if (this.img.complete && this.img.naturalWidth > 0) {
            this.lastReady = this.img
        }
        if (this.lastReady) {
            this.ctx.drawImage(
                this.lastReady,
                this.x,
                this.y,
                this.width,
                this.height
            );
        }
    }

    backgroundName(score) {
        if (score < 10) return "foggy"
        if (score < 40) return "night"
        if (score < 70) return "bad"
        if (score < 80) return "sweet"
        return "fantasy"
    }

    changeMusic(track) {
        if (track === this.currentTrack) return

        //stop every other song before starting the new one
        Object.values(this.getTracks()).forEach(other => {
            if (other !== track) other.pause()
        })

        this.currentTrack = track
        const playing = track.play()
        if (playing !== undefined) playing.catch(() => {})
    }

    backgroundChange(score) {
        const name = this.backgroundName(score)

        if (name !== this.current) {
            this.current = name
            this.img = this.images[name]
        }

        this.changeMusic(this.getTracks()[name])
    }

}
