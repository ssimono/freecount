import { html } from '../lib.js'
import { localPretty } from './utils.js'

export function onInitTrip (target, detail) {
  target.classList.add('ready')
  target._members = detail.members

  // Hide the explicit refresh if the touch events are enabled
  if (navigator.maxTouchPoints > 0) {
    const button = document.getElementById('refresh_button')
    button.parentNode.removeChild(button)
  }

}

export function onFirstExpense (target) {
  const placeholder = target.querySelector('.placeholder')
  placeholder.parentNode.removeChild(placeholder)
}

export function onNewExpense (target, expense) {
  target.prepend(expenseItem(expense, target._members))
}

export function onImmediateNewExpense (list, detail) {
  const newItem = expenseItem(detail, target._members)
  newItem.classList.add('immediate')
  list.prepend(newItem)
}

export function onLocalNewExpense (list, detail) {
  const newItem = expenseItem(detail, target._members)
  newItem.classList.add('local')
  list.prepend(newItem)
}

export function clearLocal () {
  const localExpenses = document.querySelectorAll('#expense_list .local')
  if (!localExpenses) {
    return
  }

  for (const local of localExpenses) {
    local.parentNode.removeChild(local)
  }
}

function expenseItem (expense, members) {
  const isForAll = expense.participants.length === members.length

  return html`<li>
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
