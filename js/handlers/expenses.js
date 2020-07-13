import { html } from '../lib.js'
import { localPretty } from './utils.js'

export function onInitTrip (target, detail) {
  target.classList.add('ready')
  target._members = detail.members
}

export function onFirstExpense (list) {
  const placeholder = list.querySelector('.placeholder')
  placeholder.parentNode.removeChild(placeholder)
}

export function onNewExpense (list, expense) {
  list.prepend(expenseItem(expense, list._members))
  if (list._altered) {
    const temp = document.getElementById(`immediate_${expense.id}`)
    if (temp) {
      list.removeChild(temp)
    }
  }
}

export function onImmediateNewExpense (list, expense) {
  list.prepend(expenseItem(expense, list._members, 'immediate'))
  list._altered = true
}

function expenseItem (expense, members, flag = '') {
  const isForAll = expense.participants.length === members.length
  const class_ = 'expense-item' + (flag && ` ${flag}` || '')
  const id = `${flag || 'expense'}_${expense.id}`

  return html`<li id="${id}" class="${class_}">
    <span class="title">${expense.title}</span>
    <data class="amount" value="${expense.amount}">${localPretty(expense.amount)}</data>
    <span class="description">
      paid by
      <span class="creditor">${expense.creditor}</span>
      <span class="participants ${isForAll ? 'all' : ''}">for ${smartList(expense.participants, members)}</span>
    </span>
    <time date="${expense.date}">${(new Date(expense.date)).toDateString().slice(0, -5)}</time>
  </li>`
}

function list(_items) {
  const items = [].concat(_items)

  switch(items.length) {
    case 1:
      return items[0]
    case 2:
      return items.join(' and ')
    default:
      const last = items.pop()
      return [].concat(items, `and ${last}`).join(', ')
  }
}

function smartList(participants, members) {
  if (participants.length === members.length) {
    return 'everyone'
  }

  if (participants.length <= 2) {
    return list(participants)
  }

  if (participants.length > 0.66 * members.length) {
    return 'everyone but ' + list(members.filter(m => participants.indexOf(m) === -1))
  }

  return list(participants)
}

export const _test = { smartList }
