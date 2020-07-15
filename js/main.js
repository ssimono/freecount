import { attachRoutes, dispatch, generateId, goTo, html, setupComponents } from './lib.js'
import Client, { sync, postCommand } from './client.js'
import components from './components/index.js'
import { showNotification } from './components/notify.js'

const routes = [
  // Navigation
  ['click -> [to]', ({ target }) => goTo(target.getAttribute('to'))],
  ['navigate', ({ target, detail }) => {
    switch (detail) {
      case '/setup':
        target.append(html`<fc-home></fc-home>`)
        break

      case '/trip':
        target.append(html`<fc-trip></fc-trip>`)
        break
    }
  }],

  // Generic interaction helpers
  ['http_request_start', () => document.body.classList.add('loading')],
  ['http_request_stop', () => document.body.classList.remove('loading')],

  // App logic
  ['workerupdate', () => {
    showNotification({
      message: 'A new version of Freecount has been installed in the background.',
      controls: ['Reload']
    }).then(_ => location.reload())
  }]
]

export default function main () {
  const params = new URLSearchParams(window.location.search)
  const boxId = params.get('box') || generateId(32)
  const client = new Client(boxId)

  setupComponents(...components)

  attachRoutes(routes, document.body)

  if (params.has('box')) {
    goTo('/trip')
  } else {
    goTo('/setup')
  }

  // Add statefull listeners
  attachRoutes([
    ['sync', sync(client)],
    ['app:syncerror', ({ detail }) => alert(detail)],
    ['app:postcommand', postCommand(client)],
    ['app:just_did_init_trip', () => {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('box', boxId)
      window.location.assign(newUrl.href)
    }],
    ['app:did_init_trip', ({ detail }) => {
      document.title = `${detail.name} | Freecount`
    }],
    ['local:fetch', ({ target }) => {
      withStored('known_trips', {}, (trips) => {
        dispatch(target, 'local:knowntrips', trips)
        const currentTrip = trips[boxId]
        if (currentTrip) {
          dispatch(target, 'local:trip', currentTrip)
          if (currentTrip.key) {
            client.setKey(currentTrip.key)
          }
        }
      })
    }],
    ['local:storetrip', ({ target, detail }) => {
      persist('known_trips', {}, knownTrips => {
        const content = knownTrips[boxId] || {}
        return Object.assign({}, knownTrips, { [boxId]: detail(content) })
      })
    }],
    ['encryptionkeyupdate', ({ detail }) => {
      client.setKey(detail)
      persist('known_trips', {}, knownTrips => {
        const content = knownTrips[boxId] || {}
        if (!Object.getOwnPropertyNames(content).length && detail === null) {
          // Do not keep persisting if we simply uncheck password protection when filling the init trip form
          delete knownTrips.boxId
          return knownTrips
        } else {
          content.key = detail
          return Object.assign({}, knownTrips, { [boxId]: { ...content, key: detail } })
        }
      })
    }]
  ], document.body)

  // Launch the start event
  dispatch(document.body, 'app:start')

  // Register the worker
  if ('serviceWorker' in navigator && !params.has('nosw')) {
    registerSW(client)
  }
}

function registerSW (client) {
  navigator.serviceWorker.register('./worker.js')
    .then(reg => {
      reg.onupdatefound = () => {
        if (localStorage.key(0)) {
          dispatch(document.body, 'workerupdate', null)
        }
      }
      client.hasWorker = true
      console.info('Service Worker registered… Offline support active')
    })
    .catch((error) => {
      console.error(`Registration failed with ${error}`)
    })
}

function withStored (storageKey, default_, fn) {
  if (localStorage.getItem(storageKey)) {
    fn(backport(storageKey, JSON.parse(localStorage.getItem(storageKey))))
  } else {
    fn(default_)
  }
}

function persist (storageKey, default_, fn) {
  withStored(storageKey, default_, item => {
    localStorage.setItem(storageKey, (JSON.stringify(fn(item))))
  })
}

// Turn old stored format into a new one
function backport (key, item) {
  switch (key) {
    case 'known_trips':
      return Object.getOwnPropertyNames(item)
        .map(k => [k, item[k]])
        .map(([k, v]) => typeof v === 'string' ? [v, { title: k }] : [k, v])
        .reduce((map, [k, v]) => Object.assign(map, { [k]: v }), {})
    default:
      return item
  }
}
