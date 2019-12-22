import BalanceList from './components/BalanceList.js'
import {attachRoutes, dispatch, generateId, goTo} from './lib.js'
import Client from './client.js'
import {parseForm, updateMenu, handleListGroup} from './handlers/core.js'
import * as exp from './handlers/expenses.js'

const routes = [
  // Navigation
  ['click -> [to]', ({target}) => goTo(target.getAttribute('to'))],

  // Generic interaction helpers
  ['submit -> form', parseForm],
  ['click => .list-group', handleListGroup],
  ['keypress => .list-group', handleListGroup],
  ['click => menu', updateMenu],
  ['app:error -> *', ({detail}) => alert(detail)],

  // App logic
  ['app:start -> *', ({target}) => dispatch(target, 'app:request', {})],
  ['app:submit_init_trip -> form', exp.initTrip],
  ['app:navigate => [path="/add_expense"]', exp.onAddExpenseFormOpen],
  ['app:submit_add_expense -> form', exp.addExpense],
  ['app:did_init_trip -> *', exp.onTripReady],
  ['app:did_add_expense -> *', exp.onNewExpense]
]

export default function main() {
  let boxId = localStorage.getItem('jsonbox_id')
  const params = new URLSearchParams(window.location.search)

  if (params.has('box')) {
    localStorage.setItem('jsonbox_id', params.get('box'))
    window.location.replace(window.location.origin + window.location.pathname)
    return
  } else if (params.has('logout')) {
    localStorage.clear()
    window.location.replace(window.location.origin + window.location.pathname)
  } else if (!boxId) {
    boxId = generateId(32)
    localStorage.setItem('jsonbox_id', boxId)
    goTo('/setup')
  } else {
    goTo('/trip/expenses')
  }

  const client = new Client(document.body, boxId)

  attachRoutes(routes, document.body)

  // Add statefull listeners
  attachRoutes([
    ['app:request -> *', ({detail}) => {
      client.do(detail).catch(e => dispatch(document.body, 'app:error', e.message))
    }]
  ], document.body)

  // Set up custom elements
  customElements.define('balance-list', BalanceList, { extends: 'ul' })

  // Launch the start event
  dispatch(document.body, 'app:start')

  // Register the worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./worker.js')
    .then(() => {
      console.info('Service Worker registered… Offline support active')
    })
    .catch((error) => {
      console.error(`Registration failed with ${error}`)
    })
  }
}
