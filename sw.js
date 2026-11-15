/* Service worker: permite abrir el cronograma sin internet.
   Estrategia "red primero": si hay internet siempre se carga la versión más nueva;
   si no, se usa la última copia guardada. */
const CACHE = "cronograma-v1";
const ARCHIVOS = ["./", "./index.html", "./Logo-media.jpeg"];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => Promise.all(ARCHIVOS.map(u => c.add(u).catch(() => {}))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    const req = e.request;
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;   /* Google Sheets no se toca */
    e.respondWith(
        fetch(req)
            .then(res => {
                const copia = res.clone();
                caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
    );
});
