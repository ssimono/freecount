// Increment this to simulate a new version of the worker even if the code didn't change.
// This will allow cache clearing and clients refresh
const deploy_key = 16 // eslint-disable-line
const cache_key = 'main'

self.addEventListener('install', event => {
  event.waitUntil(caches.delete(cacheKey))
  console.info('Service Worker install')
})

self.addEventListener('fetch', event => {
  const strategy = request => {
    if (request.method === 'POST') {
      return fetch(request)
    } else if (request.url.indexOf(self.location.host) >= 0 || request.url.indexOf('dev.jspm.io') >= 0) {
      return cacheFirst(request)
    } else {
      return fetchEvents(event)
    }
  }

  event.respondWith(strategy(event.request).catch(e => {
    console.error(`Error when handling request: ${e}`)
    return null
  }))
})

async function fetchAndCache (request) {
  const response = await fetch(request)
  const cache = await caches.open(cacheKey)

  cache.put(request, response.clone()).then(() => {
    console.debug(`Cached request: ${request.method} ${request.url}`)
  })

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
