const cacheKey = 'v9'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event =>
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.filter(key => key !== cacheKey).map(key => caches.delete(key)))
    })
  )
)

self.addEventListener('fetch', event => {
  const strategy = request => {
    const url = new URL(request.url)

    if (request.headers.get('X-Requested-With') === 'fc-client') {
      return manageCommands(event)
    } else if (url.host === self.location.host || url.host === 'dev.jspm.io') {
      return cacheFirst(request)
    } else {
      return fetch(request)
    }
  }

  event.respondWith(strategy(event.request).catch(e => {
    console.error(`Error when handling request: ${e}`)
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: new Headers({ 'Content-Type': 'application/json' }) }
    )
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

async function manageCommands ({ request, clientId }) {
  if (request.method === 'GET') {
    return managePull(request)
  } else if (request.method === 'POST') {
    return fetchOrCache(request)
  } else {
    return fetch(request)
  }
}

async function managePull (request) {
  const url = new URL(request.url)
  const cachedCommandsKey = `${self.location.origin}${url.pathname}`
  const clientOffset = request.headers.has('X-Fc-Offset')
    ? parseInt(request.headers.get('X-Fc-Offset'))
    : null

  if (clientOffset === 0) {
    const cached = await caches.match(cachedCommandsKey)

    if (cached) {
      return url.href === cachedCommandsKey
        ? cached
        : new Response(null, {
          status: 302,
          statusText: 'Found',
          headers: new Headers({ Location: cachedCommandsKey })
        })
    }
  }

  const response = await fetch(request)

  if (!response.ok) {
    throw new Error(`Network Error when fetching ${url.href}`)
  }

  const responsePayload = await response.clone().json()

  if (responsePayload.length) {
    updateJsonCache(cachedCommandsKey, [], commands =>
      commands.length === clientOffset
        ? [].concat(commands, responsePayload)
        : commands
    )
  }

  return response
}


async function jsonCache (key, default_) {
  const cache = await caches.open(cacheKey)
  const cached = await cache.match(key)
  return cached === undefined ? default_ : cached.json()
}

async function updateJsonCache (key, default_, fn) {
  const cache = await caches.open(cacheKey)
  const cachedBody = await jsonCache(key, default_)

  return cache.put(key, new Response(JSON.stringify(fn(cachedBody))), {
    status: 203,
    headers: new Headers({ Via: 'Service Worker', 'Content-Type': 'application/json' })
  })
}
