//Service worker: it asks the network first, always for the newest files,
//so the game (also when installed) never shows an old version stuck in the cache.
//If there is no connection, the last copy that was downloaded is used.
const CACHE = "jazz-wine-offline"

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()))

self.addEventListener("fetch", event => {
    const request = event.request
    if (request.method !== "GET") return
    if (new URL(request.url).origin !== self.location.origin) return

    //the music is left to the browser (it asks for it in pieces)
    if (request.headers.has("range") || request.destination === "audio" || request.destination === "video") return

    event.respondWith(
        fetch(request, { cache: "no-store" })
            .then(response => {
                if (response.status === 200) {
                    const copy = response.clone()
                    caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {})
                }
                return response
            })
            .catch(() => caches.match(request))
    )
})
