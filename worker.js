const cacheKey = 'v8'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.filter(key => key !== cacheKey).map(key => caches.delete(key)))
    })
  )
})

self.addEventListener('fetch', event => {
  const strategy = request => {
    const url = new URL(request.url)

    if (url.pathname.match(/^\/worker/)) {
      return controlWorker(request, url.pathname)
    } else if (request.method === 'POST') {
      return fetch(request)
    } else if (url.host === self.location.host || url.host === 'dev.jspm.io') {
      return cacheFirst(request)
    } else {
      return fetchEvents(event)
    }
  }

  event.respondWith(strategy(event.request).catch(e => {
    console.error(`Error when handling request: ${e}`)
    return new Response(JSON.stringify({ error: e.message }))
  }))
})

async function fetchAndCache (request) {
  const response = await fetch(request)
  const cache = await caches.open(cacheKey)

  cache.put(request, response.clone())
  return response
}

async function cacheFirst (request) {
  const cached = await caches.match(request)
  return cached || fetchAndCache(request)
}

async function fetchEvents ({ request, clientId }) {
  const cached = await caches.match(request)

  if (cached) {
    // Asynchronously check for more data
    checkAndRefresh(request.clone(), cached.clone(), clientId)
  } else {
    return fetchAndCache(request, cached, clientId)
  }

  return cached
}

async function checkAndRefresh (request, cached, clientId) {
  const cachedEvents = await cached.json()
  const response = await fetch(request)
  const freshEvents = await response.clone().json()

  if (freshEvents.length === cachedEvents.length) {
    return
  }

  const cache = await caches.open(cacheKey)
  await cache.put(request, response)
  const client = await clients.get(clientId)

  if (client) {
    const newEvents = freshEvents.slice(cachedEvents.length)
    for (const evt of newEvents) {
      client.postMessage(evt)
    }
  }
}

async function controlWorker (request, pathname) {
  switch (pathname) {
    case '/worker/clear-cache':
      await caches.delete(cacheKey)
      return new Response('OK')
    default:
      return new Response('Not found', { status: 404, statusText: 'Not found' })
  }
}
