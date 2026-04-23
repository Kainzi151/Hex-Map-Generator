const CACHE_NAME = "hex-map-v1";
const assets = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js"
];

// Speichert die Dateien beim ersten Aufruf auf dem Handy
self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            cache.addAll(assets);
        })
    );
});

// Lädt die Dateien beim nächsten Mal direkt vom Handy (Offline-Support)
self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request);
        })
    );
});
