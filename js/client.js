import { decrypt, dispatch, encrypt, fromBytes, toBytes } from './lib.js'
import { validate, COMMAND_VERSION } from './validation.js'

const CHUNK_SIZE = 100

const identity = x => x

export default class JsonBoxClient {
  constructor (boxId, endpoint = 'https://jsonbox.io') {
    this.boxId = boxId
    this.endpoint = endpoint
    this.offset = 0
    this.hasWorker = false
  }

  getKey () {
    return this.key ? fromBytes(this.key) : null
  }

  setKey (hexKey) {
    this.key = hexKey ? toBytes(hexKey) : null
  }

  async pull () {
    const decryptFn = this.key ? decryptMessage.bind(null, this.key) : identity
    const events = []

    while (true) {
      const { cached, body } = await fetchEventChunk(this.endpoint, this.boxId, this.offset)

      if (body.length) {
        // infering whether the content is encrypted or not
        if (!this.key && ('cipher' in body[0])) {
          return [{ command: 'unauthorized', version: COMMAND_VERSION, data: {} }]
        }

        this.offset += body.length
        events.push(...body.map(decryptFn))
      } else if (this.offset === 0) {
        return [{ command: 'empty', version: COMMAND_VERSION, data: {} }]
      }

      if (body.length >= CHUNK_SIZE || cached) {
        continue
      }

      break
    }

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
    }).then(response => {
      if (response.ok) return response.body
      else throw response
    }).then(decryptFn)
  }

  async getUnsynced () {
    if (!this.hasWorker) return Promise.resolve([])

    const decryptFn = this.key ? decryptMessage.bind(null, this.key) : identity
    return http(
      `/unsynced/${this.boxId}`,
      { headers: { 'X-Requested-With': 'fc-client' } }
    )
      .then(response => response.ok
        ? response.body.map(decryptFn)
        : []
      )
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
  ).then((response) => {
    if (response.offline) {
      return { body: [] }
    } else if (!response.ok) {
      throw response.body
    }
    return response
  })
}

export function sync (client) {
  return ({ target, detail }) => {
    if (detail && 'key' in detail) {
      client.setKey(detail.key)
    }

    dispatch(target, 'http_request_start')

    client.pull().then(events => {
      events.forEach(parseAndDispatch.bind(null, target, 'did'))
      return client.getUnsynced().then(unsynced => {
        unsynced.forEach(parseAndDispatch.bind(null, target, 'unsynced'))
        dispatch(target, 'synced')
      })
    }).catch(err => {
      if (err instanceof ForbiddenError) {
        dispatch(target, 'app:forbidden', err.message)
      } else {
        dispatch(target, 'app:syncerror', err.message)
      }
    }).finally(() => dispatch(target, 'http_request_stop'))
  }
}

export function parseAndDispatch (target, prefix, payload) {
  try {
    const { command, data } = validate(payload)
    dispatch(target, `app:${prefix}_${command}`, data)
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export function postCommand (client) {
  return ({ target, detail }) => {
    dispatch(target, 'http_request_start')
    client
      .postCommand(detail)
      .then(parseAndDispatch.bind(null, target, 'just_did'))
      .catch(err => {
        if (err.offline) {
          dispatch(target, 'app:posterror')
        } else {
          dispatch(target, 'app:syncerror', err)
        }
      })
      .finally(() => dispatch(target, 'http_request_stop'))
  }
}

async function withBody (response, result = {}) {
  const content = response.headers.get('Content-Type') || ''
  const body = content.indexOf('application/json') === 0
    ? await response.json()
    : await response.text()

  return Object.assign({}, result, { body })
}

async function http (url, req) {
  try {
    const response = await fetch(url, req)
    const status = parseInt(response.status)

    return withBody(response, {
      ok: response.ok,
      cached: status === 203,
      offline: status === 503
    })
  } catch (error) {
    return withBody(error, { ok: false })
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
