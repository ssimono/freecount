const CACHE_KEY = 'v14'
const UNSYNCED_KEY = 'unsynced'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event =>
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList
          .filter(key => [CACHE_KEY, UNSYNCED_KEY].indexOf(key) === -1)
          .map(key => caches.delete(key))
      )
    })
  )
)

self.addEventListener('fetch', event => {
  const strategy = request => {
    const url = new URL(request.url)

    if (request.headers.get('X-Requested-With') === 'fc-client') {
      switch (request.method) {
        case 'GET': return managePull(request)
        case 'POST': return managePush(request)
        default: return fetch(request)
      }
    } else if (url.host === self.location.host || url.host === 'dev.jspm.io') {
      return manageAssets(request)
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

async function manageAssets (request) {
  const cache = await caches.open(CACHE_KEY)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  } else {
    const response = await fetch(request)

    if (response.ok) {
      cache.put(request, response.clone())
    }

    return response
  }
}

async function managePull (request) {
  const url = new URL(request.url)
  const cachedCommandsKey = `${self.location.origin}${url.pathname}`
  const clientOffset = request.headers.has('X-Fc-Offset')
    ? parseInt(request.headers.get('X-Fc-Offset'))
    : null

  if (url.pathname.indexOf('/unsynced') === 0) {
    const stored = await caches.match(request)
    return stored || new Response(null, { status: 404 })
  }

  if (clientOffset === 0) {
    const cached = await caches.match(cachedCommandsKey)

    if (cached) {
      return url.href === cachedCommandsKey
        ? cached
        : new Response(null, {
          status: 302,
          statusText: 'Found',
          headers: new Headers({ Location: cachedCommandsKey, 'Content-Type': 'application/json' })
        })
    }
  }

  const response = await smartFetch(request)

  if (response.ok) {
    const responsePayload = await response.clone().json()

    if (responsePayload.length) {
      updateJsonCache(cachedCommandsKey, [], commands =>
        commands.length === clientOffset
          ? [].concat(commands, responsePayload)
          : commands
      )
    }
  }

  return response
}

async function managePush (request) {
  const response = await smartFetch(request.clone())

  if (response.ok) {
    return response
  } else {
    const boxId = (r => (new URL(r.url)).pathname)(request)
    const payload = await request.json()

    await updateJsonCache(
      `/unsynced${boxId}@${UNSYNCED_KEY}`,
      [],
      commands => [].concat(commands, payload)
    )

    return new Response(null, { status: 503, statusText: response.statusText })
  }
}

async function readFQCache (cacheKey) {
  const parts = cacheKey.split('@')
  const key = parts[0]
  const cacheName = parts.length > 1 ? parts[1] : CACHE_KEY

  return caches.open(cacheName).then(
    cache => cache.match(key),
    () => undefined
  )
}

async function writeFQCache (cacheKey, payload) {
  const parts = cacheKey.split('@')
  const key = parts[0]
  const cacheName = parts.length > 1 ? parts[1] : CACHE_KEY

  return caches.open(cacheName).then(cache => cache.put(key, payload))
}

async function jsonCache (key, default_) {
  const cached = await readFQCache(key)

  try {
    return cached ? await cached.json() : default_
  } catch (e) {
    return default_
  }
}

async function updateJsonCache (cacheKey, default_, fn) {
  const cachedBody = await jsonCache(cacheKey, default_)

  try {
    return writeFQCache(cacheKey, new Response(JSON.stringify(fn(cachedBody)), {
      status: 203,
      statusText: 'From cache',
      headers: new Headers({ Via: 'Service Worker', 'Content-Type': 'application/json' })
    }))
  } catch (e) {
    return Promise.resolve(false)
  }
}

function smartFetch (request, timeout = 5000) {
  const controller = new self.AbortController()
  const signal = controller.signal

  const fetchPromise = fetch(request, { signal })
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  if (self.navigator.offline) {
    return Promise.resolve(new Response(null, { status: 503, statusText: 'Offline' }))
  }

  return fetchPromise.then(response => {
    clearTimeout(timeoutId)
    return response
  }).catch(err => new Response(null, { status: 503, statusText: err }))
}
