import {attachRoutes, dispatch, generateId, goTo} from './lib.js'
import JsonForm from '/js/components/JsonForm.js'
import InputList from '/js/components/InputList.js'

import Client, {sync, postCommand, parseAndDispatch} from './client.js'

import {checkPull, updateMenu} from './handlers/general.js'
import {showKnownTrips} from './handlers/setupPage.js'
import * as exp from './handlers/expenses.js'
import {
  onInitTrip as balanceOnInitTrip,
  onNewExpense as balanceOnNewExpense
} from './handlers/balance.js'

const routes = [
  // Navigation
  ['click -> [to]', ({target}) => goTo(target.getAttribute('to'))],

  // Generic interaction helpers
  ['click => menu', updateMenu],
  ['app:syncerror', ({detail}) => alert(detail)],
  ['app:http_request_start', ({currentTarget}) => currentTarget.classList.add('loading')],
  ['app:http_request_stop', ({currentTarget}) => currentTarget.classList.remove('loading')],

  // App logic
  ['click => #refresh_button', exp.onRefreshButtonClicked],
  ['app:knowntrips', showKnownTrips],
  ['app:submit_init_trip', exp.initTrip],
  ['app:navigate => [path="/add_expense"]', exp.onAddExpenseFormOpen],
  ['app:submit_add_expense', exp.addExpense],
  ['app:did_init_trip', exp.onTripReady],
  ['app:did_init_trip', balanceOnInitTrip],
  ['app:did_add_expense', exp.onNewExpense],
  ['app:just_did_add_expense', exp.onImmediateNewExpense],
  ['app:failed_to_add_expense', exp.onLocalNewExpense],
  ['app:sync', exp.clearLocal],
  ['app:did_add_expense', balanceOnNewExpense],
  ['touchstart => h1,[path="/trip"]', checkPull],
  ['app:pulldown', () => dispatch(document.body, 'app:sync')],
  ['app:start', exp.toggleRefreshButton]
]

export default function main() {
  const params = new URLSearchParams(window.location.search)
  const knownTrips = JSON.parse(localStorage.getItem('known_trips') || '{}')
  const boxId = params.get('box') || generateId(32)
  const localCommandsKey = `${boxId}_commands`
  const client = new Client(boxId)

  customElements.define('json-form', JsonForm)
  customElements.define('input-list', InputList)

  attachRoutes(routes, document.body)

  if (params.has('box')) {
    goTo('/trip/expenses')
    dispatch(document.body, 'app:sync')
  } else {
    goTo('/setup')
  }

  // Add statefull listeners
  attachRoutes([
    ['app:sync', sync(client)],
    ['app:postcommand', postCommand(client)],
    ['app:just_did_init_trip', () => {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('box', boxId)
      window.location.assign(newUrl.href)
    }],
    ['app:did_init_trip', ({detail}) => {
      Object.assign(knownTrips, {[detail.name]: boxId})
      localStorage.setItem('known_trips', JSON.stringify(knownTrips))
      document.title = `${detail.name} | Freecount`
    }],
    ['app:navigate -> [path="/setup"]', ({target, detail}) => {
      dispatch(target, 'app:knowntrips', knownTrips)
    }],
    ['app:posterror', ({target, detail}) => {
      const localCommands = JSON.parse(localStorage.getItem(localCommandsKey) || '[]')
      const payload = detail.payload
      localStorage.setItem(localCommandsKey, JSON.stringify([].concat(localCommands, payload)))
      dispatch(target, `app:failed_to_${payload.command}`, payload.data)
    }],
    ['app:sync', ({target, detail}) => {
      const localCommands = JSON.parse(localStorage.getItem(localCommandsKey) || '[]')
      if (localCommands.length) {
        localStorage.setItem(localCommandsKey, '[]')
        target.addEventListener('app:http_request_stop', () => {
          localCommands.forEach(c => postCommand(client)({target, detail: c}))
        }, {once: true})
      }
    }]
  ], document.body)

  // Launch the start event
  dispatch(document.body, 'app:start')

  // Register the worker
  if ('serviceWorker' in navigator && !params.has('nosw')) {
    registerSW(client)
  }
}

function registerSW(client) {
  navigator.serviceWorker.register('./worker.js')
  .then(reg => {
    reg.onupdatefound = () => {
      console.info('A new version of Service Worker available, reloading the page…')
      setTimeout(window.location.reload(), 100)
    }
    console.info('Service Worker registered… Offline support active')
  })
  .catch((error) => {
    console.error(`Registration failed with ${error}`)
  })

  navigator.serviceWorker.addEventListener('message', event => {
    parseAndDispatch(client, document.body, event.data) && client.offset++
  })
}
