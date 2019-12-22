const preCache = () => {
  caches.open('v1').then(cache => {
    return cache.addAll([
      './index.html'
    ])
  })
}

self.addEventListener('install', (event) => {
  console.info('Service Worker install')
  event.waitUntil(preCache())
})

async function fetchAndCache(request) {
  const response = await fetch(request)
  const cache = await caches.open('v1')

  cache.put(request, response.clone())
  return response
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  return cached || await fetchAndCache(request)
}

async function fetchFirst(request) {
  try {
    return await fetchAndCache(request)
  } catch (e) {
    return await caches.match(request)
  }
}

self.addEventListener('fetch', event => {
  console.log(`${event.request.method} ${event.request.url}`)

  const strategy = request => {
    if (request.method === 'POST') {
      return fetch(request)
    } else if (request.url.indexOf(self.location.host) === -1) {
      return fetchFirst(request)
    } else {
      return cacheFirst(request)
    }
  }

  event.respondWith(strategy(event.request).catch(
    e => console.error(`Error when getting cached pages: ${e}`)
  ))
})

// self.addEventListener('fetch', event => {
//   console.log(`${event.request.method} ${event.request.url}`)
//   const proxyFunc = caches.match(event.request).then(response => {
//     console.log(`Cached response: ${Boolean(response)}`)
//     return response || fetchAndCache(event.request)
//   }).catch(e => console.error(`Error when getting cached pages: ${e}`))
//
//   event.respondWith(proxyFunc)
// })
