// Stickee Service Worker — push notifications + offline cache
// Version: 1.0.0

const CACHE_NAME = 'stickee-v1'
const OFFLINE_URL = '/'

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([OFFLINE_URL, '/favicon.ico'])
    )
  )
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch (network-first, cache fallback) ────────────────────────────────────

self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin pages
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful HTML responses
        if (response.ok && event.request.headers.get('accept')?.includes('text/html')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(cached => cached ?? caches.match(OFFLINE_URL))
      )
  )
})

// ─── Push notification received ───────────────────────────────────────────────

self.addEventListener('push', event => {
  let data = { title: 'Stickee', body: 'New activity on your account', url: '/' }
  try {
    data = { ...data, ...event.data.json() }
  } catch { /* ignore parse errors */ }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag ?? 'stickee-notification',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Open new tab
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
