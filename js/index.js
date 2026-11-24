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
    enterFullscreen()
    fitScreen()
    checkOrientation()
    game.start();
    
};

//Touch controls and screen size----------------------------------------------------------------------
const isTouch = document.documentElement.classList.contains("touch")

//the game is 900x500 inside; it is scaled to fit any screen
//(safe areas = notches and rounded corners of the phone)
const probe = document.createElement("div")
probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)"
document.body.appendChild(probe)

function fitScreen() {
    const pad = getComputedStyle(probe)
    const availW = window.innerWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight)
    const availH = window.innerHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom)

    let scale
    if (isTouch) {
        //the game uses the full height; the controls take what is left at the sides
        //(about 24% of the width, between 170 and 220 px in total), so the game gets smaller only if the screen is not wide enough
        const bands = Math.max(170, Math.min(220, 0.24 * availW))
        scale = Math.min(availH / 500, (availW - bands) / 900, 2)
    } else {
        scale = Math.min(availW / 900, availH / 500, 1)
    }
    scale = Math.max(scale, 0.2)

    canvas.style.width = `${900 * scale}px`
    canvas.style.height = `${500 * scale}px`
    document.documentElement.style.setProperty("--s", scale.toFixed(3))
}
fitScreen()
window.addEventListener("resize", fitScreen)
window.addEventListener("orientationchange", () => setTimeout(fitScreen, 200))
document.addEventListener("fullscreenchange", () => setTimeout(fitScreen, 100))
document.addEventListener("webkitfullscreenchange", () => setTimeout(fitScreen, 100))

//full screen (Android and iPad). The iPhone does not allow it in the browser:
//there the game has to be added to the home screen
function enterFullscreen() {
    if (!isTouch) return
    const element = document.documentElement
    const request = element.requestFullscreen || element.webkitRequestFullscreen
    if (!request) return

    try {
        const result = request.call(element, { navigationUI: "hide" })
        const lockLandscape = () => {
            if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {})
        }
        if (result && result.then) result.then(lockLandscape).catch(() => {})
        else lockLandscape()
    } catch (error) { /* it is optional */ }
}

const isIphone = /iPhone|iPod/.test(navigator.userAgent)
const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches
if (isIphone) document.documentElement.classList.add("ios")
if (isStandalone) document.documentElement.classList.add("standalone")

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

//each side of the screen has its own buttons: direction below, jump above
function holdButton(button, onPress, onRelease) {
    button.addEventListener("pointerdown", event => {
        event.preventDefault()
        button.setPointerCapture(event.pointerId)
        button.classList.add("on")
        onPress()
    })
    ;["pointerup", "pointercancel", "lostpointercapture"].forEach(type =>
        button.addEventListener(type, () => {
            if (!button.classList.contains("on")) return
            button.classList.remove("on")
            onRelease()
        }))
}

holdButton(document.getElementById("btnLeft"),
    () => { keys.left = true; updateVelocity() },
    () => { keys.left = false; updateVelocity() })

holdButton(document.getElementById("btnRight"),
    () => { keys.right = true; updateVelocity() },
    () => { keys.right = false; updateVelocity() })

;["jumpLeft", "jumpRight"].forEach(id =>
    holdButton(document.getElementById(id),
        () => { if (!game.winning && !game.paused) player.jump() },
        () => {}))

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



