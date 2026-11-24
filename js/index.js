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
    placeIdleStick()
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
        //(one band for the joystick, 15% of the width, between 120 and 160 px), so the game gets smaller only if the screen is not wide enough
        const band = Math.max(120, Math.min(160, 0.15 * availW))
        document.documentElement.style.setProperty('--band', `${band}px`)
        const bands = band
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

//The joystick: one thumb, on the side of the screen the player chooses.
//  drag left or right -> the dog runs
//  slide up           -> the dog jumps (diagonal = run and jump at the same time)
//It appears where the thumb touches, and follows the thumb if it goes far.
const HAND_KEY = "jazz-wine-hand"
function savedHand() {
    try { return localStorage.getItem(HAND_KEY) === "left" ? "left" : "right" } catch (e) { return "right" }
}

function setHand(hand) {
    document.documentElement.classList.toggle("hand-left", hand === "left")
    document.documentElement.classList.toggle("hand-right", hand !== "left")
    try { localStorage.setItem(HAND_KEY, hand) } catch (e) { /* it is optional */ }
    handButton.textContent = hand === "left" ? "Joystick: left hand" : "Joystick: right hand"
    placeIdleStick()
    fitScreen()
}

const handButton = document.getElementById("handButton")
handButton.addEventListener("click", () => setHand(document.documentElement.classList.contains("hand-left") ? "right" : "left"))

const stick = document.getElementById("stick")
const knob = document.getElementById("knob")
const STICK_RADIUS = 48      // how far the knob goes
const DEAD_ZONE = 14         // below this the dog does not run
const JUMP_DISTANCE = 30     // sliding up this much makes the dog jump

let stickPointer = null
let stickX = 0, stickY = 0   // where the stick is now
let jumpedWithThisPush = false

function activeZone() {
    return document.getElementById(document.documentElement.classList.contains("hand-left") ? "zone-left" : "zone-right")
}

//resting place: low in the middle of its band
function placeIdleStick() {
    if (!isTouch) return
    const rect = activeZone().getBoundingClientRect()
    if (rect.width === 0) return
    stickX = rect.left + rect.width / 2
    stickY = rect.top + rect.height * 0.68
    stick.style.left = `${stickX}px`
    stick.style.top = `${stickY}px`
    knob.style.transform = ""
}

function stickMove(event) {
    let dx = event.clientX - stickX
    let dy = event.clientY - stickY

    //the stick follows the thumb sideways and downwards, so changing direction is quick
    if (dx > STICK_RADIUS) { stickX = event.clientX - STICK_RADIUS; dx = STICK_RADIUS }
    if (dx < -STICK_RADIUS) { stickX = event.clientX + STICK_RADIUS; dx = -STICK_RADIUS }
    if (dy > STICK_RADIUS) { stickY = event.clientY - STICK_RADIUS; dy = STICK_RADIUS }
    stick.style.left = `${stickX}px`
    stick.style.top = `${stickY}px`

    keys.left = dx < -DEAD_ZONE
    keys.right = dx > DEAD_ZONE
    updateVelocity()

    //jump once for every upward slide
    if (dy < -JUMP_DISTANCE) {
        if (!jumpedWithThisPush && !game.winning && !game.paused) player.jump()
        jumpedWithThisPush = true
    } else if (dy > -JUMP_DISTANCE / 2) {
        jumpedWithThisPush = false
    }

    const length = Math.hypot(dx, dy) || 1
    const reach = Math.min(length, STICK_RADIUS)
    knob.style.transform = `translate(${dx / length * reach}px, ${Math.max(dy, -STICK_RADIUS) / length * reach}px)`
}

function stickRelease() {
    stickPointer = null
    jumpedWithThisPush = false
    keys.left = false
    keys.right = false
    updateVelocity()
    stick.classList.remove("active")
    stick.classList.add("idle")
    placeIdleStick()
}

;["zone-left", "zone-right"].forEach(id => {
    const zone = document.getElementById(id)

    zone.addEventListener("pointerdown", event => {
        if (stickPointer !== null) return
        event.preventDefault()
        stickPointer = event.pointerId
        zone.setPointerCapture(event.pointerId)
        stickX = event.clientX
        stickY = event.clientY
        stick.style.left = `${stickX}px`
        stick.style.top = `${stickY}px`
        knob.style.transform = ""
        stick.classList.remove("idle")
        stick.classList.add("active")
    })

    zone.addEventListener("pointermove", event => {
        if (event.pointerId === stickPointer) stickMove(event)
    })

    ;["pointerup", "pointercancel", "lostpointercapture"].forEach(type =>
        zone.addEventListener(type, event => {
            if (event.pointerId === stickPointer) stickRelease()
        }))
})

setHand(savedHand())
;["resize", "orientationchange", "fullscreenchange", "webkitfullscreenchange"].forEach(type =>
    window.addEventListener(type, () => setTimeout(placeIdleStick, 250)))

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
