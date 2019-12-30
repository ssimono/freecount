import BalanceList from './components/BalanceList.js'
import {attachRoutes, dispatch, generateId, goTo} from './lib.js'
import Client, {sync, postCommand, parseAndDispatch} from './client.js'
import {parseForm, updateMenu, addItem, removeItem} from './handlers/core.js'
import * as exp from './handlers/expenses.js'

const routes = [
  // Navigation
  ['click -> [to]', ({target}) => goTo(target.getAttribute('to'))],

  // Generic interaction helpers
  ['submit -> form', parseForm],
  ['click => .list-group ul -> .add', addItem],
  ['click => .list-group ul -> .remove', removeItem],
  ['click => menu', updateMenu],
  ['app:syncerror', ({detail}) => alert(detail)],

  // App logic
  ['app:knowntrips', exp.showKnownTrips],
  ['app:submit_init_trip', exp.initTrip],
  ['app:navigate => [path="/trip/expenses"]', ({target}) => dispatch(target, 'app:sync')],
  ['app:navigate => [path="/add_expense"]', exp.onAddExpenseFormOpen],
  ['app:submit_add_expense', exp.addExpense],
  ['app:did_init_trip', exp.onTripReady],
  ['app:did_add_expense', exp.onNewExpense]
]

export default function main() {
  const params = new URLSearchParams(window.location.search)
  const knownTrips = JSON.parse(localStorage.getItem('known_trips') || '{}')
  const boxId = params.get('box') || generateId(32)
  const client = new Client(boxId)

  attachRoutes(routes, document.body)

  if (params.has('box')) {
    goTo('/trip/expenses')
  } else {
    goTo('/setup')
  }

  // Add statefull listeners
  attachRoutes([
    ['app:sync', sync(client)],
    ['app:postcommand', postCommand(client)],
    ['app:did_init_trip', ({detail}) => {
      Object.assign(knownTrips, {[detail.name]: boxId})
      localStorage.setItem('known_trips', JSON.stringify(knownTrips))

      if (!params.has('box')) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('box', boxId)
        window.location.assign(newUrl.href)
      }

      document.title = `${detail.name} | Freecount`
    }],
    ['app:navigate -> [path="/setup"]', ({target, detail}) => {
      dispatch(target, 'app:knowntrips', knownTrips)
    }]
  ], document.body)

  // Set up custom elements
  customElements.define('balance-list', BalanceList, { extends: 'ul' })

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
