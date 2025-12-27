// Service Worker для Новый Год 2026
// Версия: 2.0

const CACHE_NAME = 'newyear2026-v2.0';
const RUNTIME_CACHE = 'newyear2026-runtime';

// Критические ресурсы для кэширования при установке
const PRECACHE_URLS = [
    '/new-year_2026/',
    '/new-year_2026/index.html',
    '/new-year_2026/css/new-year.css',
    '/new-year_2026/js/new-year.js',
    '/new-year_2026/manifest.webmanifest',
    '/new-year_2026/icons/icon-192.png',
    '/new-year_2026/icons/icon-512.png',
    // Основные изображения
    '/new-year_2026/images/room-800.webp',
    '/new-year_2026/images/grendsnow-800.webp',
    // Lottie анимации
    '/new-year_2026/animations/cristmas-tree.json',
    '/new-year_2026/animations/logo.json'
];

// CDN ресурсы (не кэшируем, всегда берем из сети)
const EXTERNAL_RESOURCES = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://unpkg.com',
    'https://cdnjs.cloudflare.com'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v2.0...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching resources...');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[SW] Precache complete');
                return self.skipWaiting(); // Активировать немедленно
            })
            .catch((error) => {
                console.error('[SW] Precache failed:', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v2.0...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Удаляем старые кэши
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim(); // Взять контроль над всеми клиентами
            })
    );
});

// Fetch - стратегия кэширования
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Пропускаем внешние CDN ресурсы (всегда из сети)
    if (EXTERNAL_RESOURCES.some(domain => url.href.startsWith(domain))) {
        return; // Браузер сам загрузит
    }

    // Пропускаем запросы к API и формам
    if (request.method !== 'GET') {
        return;
    }

    // Для HTML - Network First (всегда свежий контент)
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Для статических ресурсов (CSS, JS, изображения) - Cache First
    if (
        request.url.includes('/css/') ||
        request.url.includes('/js/') ||
        request.url.includes('/images/') ||
        request.url.includes('/animations/') ||
        request.url.includes('/icons/') ||
        request.url.match(/\.(css|js|webp|png|jpg|jpeg|svg|json|woff2?)$/)
    ) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Для всех остальных - Network First
    event.respondWith(networkFirst(request));
});

// Стратегия: Cache First (быстрая загрузка)
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
    }

    try {
        const response = await fetch(request);
        // Кэшируем успешные ответы
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        // Возвращаем оффлайн страницу (если есть)
        return caches.match('/new-year_2026/offline.html') || new Response('Offline');
    }
}

// Стратегия: Network First (всегда свежий контент)
async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        const response = await fetch(request);
        // Кэшируем успешные ответы
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        // Fallback для HTML страниц
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/new-year_2026/') || new Response('Offline', { status: 503 });
        }
        throw error;
    }
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    console.log('[SW] Received message:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// Push notifications (для будущего использования)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'Новое обновление!',
        icon: '/new-year_2026/icons/icon-192.png',
        badge: '/new-year_2026/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть',
                icon: '/new-year_2026/icons/icon-192.png'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Новый Год 2026', options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event.action);

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/new-year_2026/')
        );
    }
});

console.log('[SW] Service Worker loaded');
