import fastSha from 'https://dev.jspm.io/npm:fast-sha256@1.3.0/sha256.min.js'
import { fromBytes, toBytes } from './lib.js'

export const COMMAND_VERSION = 2

export function validate (payload) {
  const _assert = assert.bind(null, JSON.stringify(payload))

  assertHas(payload, 'command', 'version', 'data')

  if (payload.version < COMMAND_VERSION) {
    return validate(backport(payload))
  }

  _assert(payload.version === COMMAND_VERSION, 'invalid or unsupported version')
  _assert(
    ['init_trip', 'add_expense', 'unauthorized', 'empty'].indexOf(payload.command) !== -1,
    `unknown command ${payload.command}`
  )

  const { command, data } = payload

  switch (command) {
    case 'init_trip':
      assertHas(data, 'members', 'name', 'currency')
      _assert(data.members.length, 'missing members')
      _assert(data.name.length, 'invalid name')
      _assert(data.currency.length === 3, 'invalid currency')
      break
    case 'add_expense':
      assertHas(data, 'id', 'creditor', 'participants', 'amount', 'date')
      _assert(!Number.isNaN(Number(data.amount)))
      _assert((new Date(data.date)) instanceof Date, `invalid date: ${data.date}`)
      break
  }

  return { command, data }
}

function assert (context, predicate, message = '') {
  if (!predicate) throw new Error(`Invalid command: ${context && `${context}: `}${message}`)
}

function assertHas (obj, ...props) {
  const current = Object.getOwnPropertyNames(obj)
  const context = JSON.stringify(obj)
  for (const prop of props) {
    assert(context, current.indexOf(prop) >= 0, `Missing property: ${prop}`)
  }
}

function backport (payload) {
  const stamped = (p, v) => Object.assign({}, { ...p, version: v })

  switch (payload.version) {
    case 1: // 1 → 2
      if (payload.command === 'add_expense') {
        assertHas(payload.data, 'creditor', 'participants', 'amount', 'date')

        const { creditor, participants, amount, date } = payload.data
        const timestamp = payload._createdOn || ''

        payload.data.id = fromBytes(fastSha.hash(toBytes(`${creditor}${JSON.stringify(participants)}${amount}${date}${timestamp}`)))
        return stamped(payload, 2)
      } else return stamped(payload, 2)

    default:
      throw new Error(`Cannot backport from version ${payload.version} to ${COMMAND_VERSION}`)
  }
}
