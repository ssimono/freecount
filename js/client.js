import {dispatch} from './lib.js'

const COMMAND_VERSION = 1
const CHUNK_SIZE = 100

export default class JsonBoxClient {
  constructor(boxId, endpoint = 'https://jsonbox.io') {
    this.boxId = boxId
    this.endpoint = endpoint
    this.offset = 0
  }

  async getAllRemoteEvents() {
    const events = []
    let newEvents = []
    do {
      newEvents = await this.getRemoteEvents()
      events.push(...newEvents)
    } while(newEvents.length >= CHUNK_SIZE);

    return events
  }

  async getRemoteEvents() {
    const events = await http(
      `${this.endpoint}/${this.boxId}?sort=_createdOn&limit=${CHUNK_SIZE}&skip=${this.offset}`,
      null
    )

    this.offset += events.length

    return events
  }

  async postCommand (command) {
    const url = `${this.endpoint}/${this.boxId}`

    return await http(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({...command, version: COMMAND_VERSION})
    })
  }
}

export function sync(client) {
  return ({target}) => {
    dispatch(target, 'app:http_request_start')
    client.getAllRemoteEvents().then(events =>
      events.forEach(payload => parseAndDispatch(client, target, payload))
    ).catch(err => {
      dispatch(target, 'app:syncerror', err.message)
    }).finally(() => dispatch(target, 'app:http_request_stop'))
  }
}

export function parseAndDispatch(client, target, payload) {
  try {
    const {command, data} = validate(payload)
    dispatch(target, `app:did_${command}`, data)
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export function postCommand(client) {
  return ({target, detail}) => {
    dispatch(target, 'app:http_request_start')
    client.postCommand(detail).then(body => {
      const {command, data} = validate(body)
      dispatch(target, `app:just_did_${command}`, data)
    }).catch(err => {
      if(err.message.indexOf('NetworkError') !== -1) {
        dispatch(target, 'app:posterror', {err, payload: detail})
      } else {
        dispatch(target, 'app:syncerror', err.message)
      }
    }).finally(() => dispatch(target, 'app:http_request_stop'))
  }
}

async function http(url, req) {
  const response = await fetch(url, req)
  const status = response.status

  if (status >= 200 && status < 400) {
    return await response.json()
  } else if (status >= 400 && status < 500) {
    const json = await response.json()
    throw new Error(`Got error ${status}: ${json.message}`)
  } else {
    throw new Error(`Got error ${status}`)
    console.error(response)
  }
}

export function validate(payload) {
  const assert = function(predicate, message = '') {
    if (!predicate) throw new Error(`Invalid command: ${JSON.stringify(payload)}: ${message}`)
  }

  const assertHas = function (obj, ...props) {
    const current = Object.getOwnPropertyNames(obj)
    for(let prop of props) {
      assert(current.indexOf(prop) >= 0, `Missing property: ${prop}`)
    }
  }

  assertHas(payload, 'command', 'version', 'data', '_createdOn')
  assert(payload.version === COMMAND_VERSION, 'invalid or unsupported version')
  assert(['init_trip', 'add_expense'].indexOf(payload.command) !== -1, `unknown command ${payload.command}`)

  const {command, data} = payload

  switch(command) {
    case 'init_trip':
      assertHas(data, 'members', 'name', 'currency')
      assert(data.members.length, 'missing members')
      assert(data.name.length, 'invalid name')
      assert(data.currency.length === 3, 'invalid currency')
      break;
    case 'add_expense':
      assertHas(data, 'creditor', 'participants', 'amount', 'date')
      assert((new Date(data.date)) instanceof Date, `invalid date: ${data.date}`)
      break;
  }

  return {command, data}
}
