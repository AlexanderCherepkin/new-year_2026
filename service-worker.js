const CORE_CACHE = 'ny2026-core-v3';
const ASSETS_CACHE = 'ny2026-assets-v3';
const CORE_URLS = [
    '/',
    '/index.html',
    '/css/new-year.css',
    '/js/new-year.js',
    '/manifest.webmanifest',
    '/icons/icon-192.png'
];

// Устанавливаем Service Worker
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CORE_CACHE)
            .then(cache => cache.addAll(CORE_URLS))
            .catch(() => {}) // Игнорируем ошибки при установке
    );
});

// Активируем Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CORE_CACHE && cacheName !== ASSETS_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Обрабатываем запросы
self.addEventListener('fetch', event => {
    const { request } = event;
    
    // Игнорируем несетевые запросы
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Стратегия для HTML
    if (request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const responseToCache = response.clone();
                        caches.open(CORE_CACHE)
                            .then(cache => cache.put(request, responseToCache))
                            .catch(() => {});
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(cached => cached || caches.match('/index.html'));
                })
        );
        return;
    }
    
    // Стратегия для CSS/JS - cache first
    if (request.destination === 'style' || request.destination === 'script') {
        event.respondWith(
            caches.match(request)
                .then(cached => {
                    if (cached) {
                        return cached;
                    }
                    return fetch(request).then(response => {
                        if (response && response.ok) {
                            const responseToCache = response.clone();
                            caches.open(CORE_CACHE)
                                .then(cache => cache.put(request, responseToCache))
                                .catch(() => {});
                        }
                        return response;
                    });
                })
                .catch(() => {})
        );
        return;
    }
    
    // Стратегия для изображений - cache first  
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(cached => {
                    if (cached) {
                        return cached;
                    }
                    return fetch(request).then(response => {
                        if (response && response.ok) {
                            const responseToCache = response.clone();
                            caches.open(ASSETS_CACHE)
                                .then(cache => cache.put(request, responseToCache))
                                .catch(() => {});
                        }
                        return response;
                    });
                })
                .catch(() => {})
        );
        return;
    }
    
    // Для остальных - network first
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// Обработка сообщений
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
