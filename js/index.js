const outCanvas = document.getElementById("out-canvas")
const inCanvas = document.getElementById("in-canvas") 
console.log(outCanvas)
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

//variables-------------------------------------------------------------------------------------------
//create new main character from the Player class
const player = new Player(ctx)

//create new first secondary from the Glass class
const glass = new Glass(ctx)

//create new first secondary from the Bottle class
const bottleBig = new BottleBig(ctx)

//create new second secondary from the Cat class
const cat = new Cat(ctx)

//create new second secondary from the CatNinja class
const catNinja = new CatNinja(ctx)

//create the cat that runs on the floor (the dog has to jump over it)
const runnerCat = new RunnerCat(ctx)

//create the special bread that falls only a few times
const bread = new Bread(ctx)

//create new Background from the Background class
const background = new Background(ctx)


//create new Game from the Game class
const game = new Game(ctx, player, glass, bottleBig, cat, catNinja, background, runnerCat, bread)

//Button-----------------------------------------------------------------------------------------------
const startButton = document.getElementById("startButton")

//link start the game with the button.
startButton.onclick = ()=> {
    inCanvas.classList.toggle("hidden")
    outCanvas.classList.toggle("hidden")
    startButton.textContent = "!Speed Up!"
    startButton.blur();
    fitScreen()
    checkOrientation()
    game.start();
    
};

//Touch controls and screen size----------------------------------------------------------------------
const isTouch = document.documentElement.classList.contains("touch")

//the game is 900x500 inside; it is scaled to fit any screen
function fitScreen() {
    const maxScale = isTouch ? 2 : 1
    const scale = Math.min(window.innerWidth / 900, window.innerHeight / 500, maxScale)
    canvas.style.width = `${900 * scale}px`
    canvas.style.height = `${500 * scale}px`
    document.documentElement.style.setProperty("--s", scale.toFixed(3))
}
fitScreen()
window.addEventListener("resize", fitScreen)
window.addEventListener("orientationchange", () => setTimeout(fitScreen, 200))

//a phone held upright: the game waits until it is turned sideways
const portraitQuery = window.matchMedia("(orientation: portrait)")
function checkOrientation() {
    game.paused = isTouch && portraitQuery.matches
    if (game.paused) {
        keys.left = false
        keys.right = false
        updateVelocity()
    }
}
portraitQuery.addEventListener("change", checkOrientation)

//the left and right arrows work as one pad, so the thumb can slide from one to the other
const dpad = document.getElementById("dpad")
const padLeft = document.getElementById("padLeft")
const padRight = document.getElementById("padRight")

function padPress(event) {
    const rect = dpad.getBoundingClientRect()
    const goesLeft = event.clientX < rect.left + rect.width / 2
    keys.left = goesLeft
    keys.right = !goesLeft
    padLeft.classList.toggle("on", goesLeft)
    padRight.classList.toggle("on", !goesLeft)
    updateVelocity()
}

function padRelease() {
    keys.left = false
    keys.right = false
    padLeft.classList.remove("on")
    padRight.classList.remove("on")
    updateVelocity()
}

dpad.addEventListener("pointerdown", event => {
    event.preventDefault()
    dpad.setPointerCapture(event.pointerId)
    padPress(event)
})
dpad.addEventListener("pointermove", event => {
    if (dpad.hasPointerCapture(event.pointerId)) padPress(event)
})
;["pointerup", "pointercancel", "lostpointercapture"].forEach(type => dpad.addEventListener(type, padRelease))

//the jump button
const jumpButton = document.getElementById("btnJump")
jumpButton.addEventListener("pointerdown", event => {
    event.preventDefault()
    jumpButton.classList.add("on")
    if (!game.winning && !game.paused) player.jump()
})
;["pointerup", "pointercancel", "pointerleave"].forEach(type =>
    jumpButton.addEventListener(type, () => jumpButton.classList.remove("on")))

//no menu when pressing for a long time
document.addEventListener("contextmenu", event => { if (isTouch) event.preventDefault() })

//Play again---------------------------------------------------------------------------------------------
const playAgainButton = document.getElementById("playAgain")

//called by the game when it ends (win or lose)
function onGameEnd(result) {
    keys.left = false
    keys.right = false
    playAgainButton.textContent = result === "win" ? "Play again" : "Try again"
    playAgainButton.classList.remove("hidden")
    playAgainButton.focus()
}

//puts a game object back to its initial state (keeping its already loaded images)
function resetObject(object, NewObject) {
    const images = {}
    Object.keys(object).forEach(key => {
        if (object[key] instanceof HTMLImageElement) images[key] = object[key]
    })
    Object.assign(object, new NewObject(ctx), images)
}

function restartGame() {
    playAgainButton.classList.add("hidden")
    playAgainButton.blur()

    ;[main1, main2, main3, final, win].forEach(audio => {
        audio.pause()
        audio.currentTime = 0
    })

    resetObject(player, Player)
    resetObject(glass, Glass)
    resetObject(bottleBig, BottleBig)
    resetObject(cat, Cat)
    resetObject(catNinja, CatNinja)
    resetObject(runnerCat, RunnerCat)
    resetObject(bread, Bread)

    background.current = "night"
    background.img = background.images.night
    background.currentTrack = null

    Object.assign(game, new Game(ctx, player, glass, bottleBig, cat, catNinja, background, runnerCat, bread))

    //whoever plays again already knows the tutorial: it is skipped, and the three golden breads come later
    game.tutorial.active = false

    keys.left = false
    keys.right = false
    player.vx = 0
    checkOrientation()
    game.start()
}

playAgainButton.onclick = restartGame

//Events------------------------------------------------------------------------------

//link movement to the keyboard.
//left / right move the dog, up / space / W make it jump.
const keys = { left: false, right: false }

function updateVelocity() {
    player.vx = (keys.right ? 8 : 0) - (keys.left ? 8 : 0)
}

document.addEventListener('keydown', (event)=>{
    switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
            keys.left = true
            updateVelocity()
            event.preventDefault()
            break;
        case "ArrowRight":
        case "KeyD":
            keys.right = true
            updateVelocity()
            event.preventDefault()
            break;
        case "ArrowUp":
        case "KeyW":
        case "Space":
            //holding the key does not make the dog jump again and again
            if (!event.repeat && !game.winning) player.jump()
            event.preventDefault()
    }
});

//only the key that is released stops its own direction
//(releasing the jump key does not stop the dog)
document.addEventListener("keyup", (event)=>{
    switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
            keys.left = false
            break;
        case "ArrowRight":
        case "KeyD":
            keys.right = false
    }
    updateVelocity()
})


//Music & Sounds------------------------------------------------------------------------------

const main1 = new Audio("audio/song-flauta.mp3")
const main2 = new Audio("audio/intro.mp3")
const main3 = new Audio("audio/a-mysterious-town-9689.mp3")
const final = new Audio("audio/epic.mp3")
const win = new Audio("audio/win.wav")
const glass1 = new Audio("audio/glass.wav")
const glass2 = new Audio("audio/glass2.wav")
const glass3 =new Audio("audio/glass3.wav")
const ninjaCat1 = new Audio("audio/ninjacat.wav")
const ninjaCat2 = new Audio("audio/ninjaCat2.wav")
const bigBottle1 = new Audio("audio/bigbottle.wav")
const bigBottle2 = new Audio("audio/bigbottle2.wav")
const bigBottle4 = new Audio("audio/bigBottle4.wav")
const bigBottle5 = new Audio ("audio/uou.wav")
const bigBottle6 = new Audio("audio/levelup.wav")
const cat1 = new Audio ("audio/cat2.wav")
const cat2 = new Audio ("audio/cat3.wav")



