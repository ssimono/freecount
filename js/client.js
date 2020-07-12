import { decrypt, dispatch, encrypt, fromBytes, toBytes } from './lib.js'

const COMMAND_VERSION = 1
const CHUNK_SIZE = 100

const identity = x => x

export default class JsonBoxClient {
  constructor (boxId, endpoint = 'https://jsonbox.io') {
    this.boxId = boxId
    this.endpoint = endpoint
    this.offset = 0
  }

  getKey () {
    return this.key ? fromBytes(this.key) : null
  }

  setKey (hexKey) {
    this.key = hexKey ? toBytes(hexKey) : null
  }

  async pull () {
    const events = []
    let newEvents = []
    do {
      newEvents = await fetchEventChunk(this.endpoint, this.boxId, this.offset)
      if (this.offset === 0 && newEvents.length && !this.key) {
        // infering whether the content is encrypted or not
        const firstEvent = newEvents[0]
        if ('cipher' in firstEvent) {
          return [{ command: 'unauthorized', version: COMMAND_VERSION, data: {} }]
        }
      }

      const decryptFn = this.key ? decryptMessage.bind(null, this.key) : identity

      events.push(...newEvents.map(decryptFn))
      this.offset += newEvents.length
    } while (newEvents.length >= CHUNK_SIZE)

    return events
  }

  async postCommand (command) {
    const url = `${this.endpoint}/${this.boxId}`
    const encryptFn = this.key ? encryptMessage.bind(null, this.key) : identity
    const decryptFn = this.key ? decryptMessage.bind(null, this.key) : identity

    return http(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fc-client'
      },
      body: JSON.stringify(encryptFn({ ...command, version: COMMAND_VERSION }))
    }).then(decryptFn)
  }
}

class ForbiddenError extends Error {}

async function fetchEventChunk (endpoint, boxId, offset) {
  return http(
    `${endpoint}/${boxId}?sort=_createdOn&limit=${CHUNK_SIZE}&skip=${offset}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fc-client',
        'X-Fc-Offset': `${offset}`
      }
    }
  )
}

export function sync (client) {
  return ({ target, detail }) => {
    if (detail && 'key' in detail) {
      client.setKey(detail.key)
    }

    dispatch(target, 'http_request_start')
    client.pull().then(events =>
      events.forEach(payload => parseAndDispatch(client, target, payload))
    ).catch(err => {
      if (err instanceof ForbiddenError) {
        dispatch(target, 'app:forbidden', err.message)
      } else {
        dispatch(target, 'app:syncerror', err.message)
      }
    }).finally(() => dispatch(target, 'http_request_stop'))
  }
}

export function parseAndDispatch (client, target, payload) {
  try {
    const { command, data } = validate(payload)
    dispatch(target, `app:did_${command}`, data)
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export function postCommand (client) {
  return ({ target, detail }) => {
    dispatch(target, 'http_request_start')
    client.postCommand(detail).then(body => {
      const { command, data } = validate(body)
      dispatch(target, `app:just_did_${command}`, data)
    }).catch(err => {
      if (err.message.indexOf('NetworkError') !== -1) {
        dispatch(target, 'app:posterror', { err, payload: detail })
      } else {
        dispatch(target, 'app:syncerror', err.message)
      }
    }).finally(() => dispatch(target, 'http_request_stop'))
  }
}

async function http (url, req) {
  const response = await fetch(url, req)
  const status = response.status

  if (status >= 200 && status < 400) {
    return response.json()
  } else if (status >= 400 && status < 500) {
    const json = await response.json()
    throw new Error(`Got error ${status}: ${json.message}`)
  } else {
    console.error(response)
    throw new Error(`Got error ${status}`)
  }
}

function decryptMessage (key, message) {
  try {
    const payload = JSON.parse(decrypt(key, message.cipher))
    return Object.assign({ ...message, ...payload }, { cipher: undefined })
  } catch (e) {
    throw new ForbiddenError('Invalid password')
  }
}

function encryptMessage (key, message) {
  const payload = JSON.stringify(message)
  return { cipher: encrypt(key, payload) }
}

export function validate (payload) {
  const assert = function (predicate, message = '') {
    if (!predicate) throw new Error(`Invalid command: ${JSON.stringify(payload)}: ${message}`)
  }

  const assertHas = function (obj, ...props) {
    const current = Object.getOwnPropertyNames(obj)
    for (const prop of props) {
      assert(current.indexOf(prop) >= 0, `Missing property: ${prop}`)
    }
  }

  assertHas(payload, 'command', 'version', 'data', '_createdOn')
  assert(payload.version === COMMAND_VERSION, 'invalid or unsupported version')
  assert(
    ['init_trip', 'add_expense', 'unauthorized'].indexOf(payload.command) !== -1,
    `unknown command ${payload.command}`
  )

  const { command, data } = payload

  switch (command) {
    case 'init_trip':
      assertHas(data, 'members', 'name', 'currency')
      assert(data.members.length, 'missing members')
      assert(data.name.length, 'invalid name')
      assert(data.currency.length === 3, 'invalid currency')
      break
    case 'add_expense':
      assertHas(data, 'creditor', 'participants', 'amount', 'date')
      assert(!Number.isNaN(Number(data.amount)))
      assert((new Date(data.date)) instanceof Date, `invalid date: ${data.date}`)
      break
  }

  return { command, data }
}
