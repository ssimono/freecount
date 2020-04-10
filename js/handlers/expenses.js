import { html } from '../lib.js'
import { localPretty } from './utils.js'

export function onInitTrip (target, detail) {
  target.classList.add('ready')

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
  target.prepend(expenseItem(expense))
}

export function onImmediateNewExpense (list, detail) {
  const newItem = expenseItem(detail)
  newItem.classList.add('immediate')
  list.prepend(newItem)
}

export function onLocalNewExpense (list, detail) {
  const newItem = expenseItem(detail)
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

function expenseItem (expense) {
  return html`<li>
    <span class="title">${expense.title}</span>
    <data class="amount" value="${expense.amount}">${localPretty(expense.amount)}</data>
    <span class="creditor">paid by ${expense.creditor}</span>
    <time date="${expense.date}">${(new Date(expense.date)).toDateString().slice(0, -5)}</time>
  </li>`
}
