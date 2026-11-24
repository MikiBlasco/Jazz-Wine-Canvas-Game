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
    startButton.blur();

    //none of these extras can stop the game from starting
    const safely = (step, name) => {
        try { step() } catch (error) { if (window.jwShowError) window.jwShowError(`${name}: ${error.message}`) }
    }
    safely(enterFullscreen, "fullscreen")
    safely(fitScreen, "size")
    safely(checkOrientation, "orientation")

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
        //(one band for the pad, 15% of the width, between 120 and 160 px), so the game gets smaller only if the screen is not wide enough
        const both = document.documentElement.classList.contains("hand-both")
        const band = both
            ? Math.max(96, Math.min(125, 0.115 * availW))
            : Math.max(120, Math.min(160, 0.15 * availW))
        document.documentElement.style.setProperty("--band", `${band}px`)
        const bands = both ? 2 * band : band
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
const fullscreenButton = document.getElementById("fullscreenButton")
const canFullscreen = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)
if (canFullscreen) document.documentElement.classList.add("can-fullscreen")

function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement)
}

function updateFullscreenButton() {
    fullscreenButton.innerHTML = isFullscreen() ? "&#9974; Exit full screen" : "&#9974; Full screen"
}
document.addEventListener("fullscreenchange", updateFullscreenButton)
document.addEventListener("webkitfullscreenchange", updateFullscreenButton)

//the button of the cover: full screen on or off, before pressing Play
fullscreenButton.addEventListener("click", () => {
    if (isFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen
        if (exit) exit.call(document)
    } else {
        enterFullscreen()
    }
})

//Play also asks for it, if it was not asked before
function enterFullscreen() {
    if (!isTouch || isFullscreen()) return
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

//The pad: one fixed circle at the side of the game (right, left, or both sides).
//Where the finger is inside the circle decides what the dog does:
//  left side   -> runs left          right side  -> runs right
//  upper moon  -> jumps              (upper-left / upper-right: runs and jumps)
//You can press a side, or slide from one place to another without lifting the finger.
const HAND_KEY = "jazz-wine-hand"
const HANDS = ["both", "right", "left"]
const HAND_TEXT = { both: "Controls: both sides", right: "Controls: right hand", left: "Controls: left hand" }

function savedHand() {
    try {
        const hand = localStorage.getItem(HAND_KEY)
        return HANDS.includes(hand) ? hand : "both"
    } catch (e) { return "both" }
}

const handButton = document.getElementById("handButton")
let currentHand = "both"

function setHand(hand) {
    currentHand = hand
    HANDS.forEach(name => document.documentElement.classList.toggle(`hand-${name}`, name === hand))
    try { localStorage.setItem(HAND_KEY, hand) } catch (e) { /* it is optional */ }
    handButton.textContent = HAND_TEXT[hand]
    fitScreen()
}

handButton.addEventListener("click", () => setHand(HANDS[(HANDS.indexOf(currentHand) + 1) % HANDS.length]))

const SIDE_ZONE = 0.22   // the dog runs when the finger is this far (x radius) from the center
const JUMP_ZONE = 0.30   // and it jumps when the finger is this far (x radius) above the center

let padPointer = null    // the finger that is playing now

function makePad(zone) {
    const pad = zone.querySelector(".pad")
    const thumb = zone.querySelector(".thumb")
    let jumpHeld = false

    function read(event) {
        const rect = pad.getBoundingClientRect()
        const radius = rect.width / 2
        const dx = event.clientX - (rect.left + radius)
        const dy = event.clientY - (rect.top + radius)

        const left = dx < -radius * SIDE_ZONE
        const right = dx > radius * SIDE_ZONE
        const up = dy < -radius * JUMP_ZONE

        keys.left = left
        keys.right = right
        updateVelocity()

        //one jump every time the finger gets into the upper moon
        if (up && !jumpHeld && !game.winning && !game.paused) player.jump()
        jumpHeld = up

        pad.classList.toggle("l", left)
        pad.classList.toggle("r", right)
        pad.classList.toggle("u", up)

        //the dot follows the finger inside the circle
        const length = Math.hypot(dx, dy) || 1
        const reach = Math.min(length, radius * 0.7)
        thumb.style.transform = `translate(${dx / length * reach}px, ${dy / length * reach}px)`
    }

    function release() {
        padPointer = null
        jumpHeld = false
        keys.left = false
        keys.right = false
        updateVelocity()
        pad.classList.remove("l", "r", "u", "touching")
        thumb.style.transform = ""
    }

    zone.addEventListener("pointerdown", event => {
        if (padPointer !== null) return
        event.preventDefault()
        padPointer = event.pointerId
        zone.setPointerCapture(event.pointerId)
        pad.classList.add("touching")
        read(event)
    })

    zone.addEventListener("pointermove", event => {
        if (event.pointerId === padPointer) read(event)
    })

    ;["pointerup", "pointercancel", "lostpointercapture"].forEach(type =>
        zone.addEventListener(type, event => {
            if (event.pointerId === padPointer) release()
        }))
}

makePad(document.getElementById("zone-left"))
makePad(document.getElementById("zone-right"))

setHand(savedHand())

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





//offline copy + always the newest version
if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {})
}
