import { dispatch, goTo, html } from '../lib.js'
import { pretty } from './utils.js'

export function onTripReady ({ target, detail }) {
  document.querySelector('h1').innerText = detail.name
  document.getElementById('expense_list').classList.add('ready')

  const creditorChoice = document.getElementById('creditor_choice')
  const participantsChoice = document.getElementById('participants_choice')

  detail.members.forEach((member, idx) => {
    creditorChoice.append(
      html`<input type="radio" name="creditor" id="add_expense_creditor_${idx}" value="${member}" required></input>`,
      html`<label for="add_expense_creditor_${idx}">${member}</label>`
    )

    participantsChoice.append(
      html`<input type="checkbox" name="participants[]" id="add_expense_participant_${idx}" value="${member}" checked></input>`,
      html`<label for="add_expense_participant_${idx}">${member}</label>`
    )
  })
}

export function onRefreshButtonClicked (event) {
  event.preventDefault()
  dispatch(event.target, 'app:sync')
}

export function onNewExpense ({ detail }) {
  document.getElementById('expense_list').prepend(expenseItem(detail))
}

export function onImmediateNewExpense ({ detail }) {
  const newItem = expenseItem(detail)
  newItem.classList.add('immediate')
  document.getElementById('expense_list').prepend(newItem)
}

export function onLocalNewExpense ({ detail }) {
  const newItem = expenseItem(detail)
  newItem.classList.add('local')
  document.getElementById('expense_list').prepend(newItem)
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

export function onAddExpenseFormOpen ({ target }) {
  const titleInput = target.querySelector('form [name="title"]')
  const dateInput = target.querySelector('form [name="date"]')

  if (!titleInput.value) {
    titleInput.focus()
  }

  if (!dateInput.value) {
    dateInput.value = (new Date()).toISOString().substr(0, 10)
  }
}

export function initTrip ({ target, detail }) {
  dispatch(target, 'app:postcommand', { command: 'init_trip', data: detail })
}

export function addExpense ({ target, detail }) {
  dispatch(target, 'app:postcommand', { command: 'add_expense', data: detail })
  target.addEventListener('app:http_request_stop', () => {
    dispatch(target, 'app:sync')
    goTo('/trip/expenses')
  }, { once: true })
}

export function toggleRefreshButton () {
  // Hide the explicit refresh if the touch events are enabled
  if (navigator.maxTouchPoints > 0) {
    const button = document.getElementById('refresh_button')
    button.parentNode.removeChild(button)
  }
}

function expenseItem (expense) {
  return html`<li>
    <span class="title">${expense.title}</span>
    <data class="amount" value="${expense.amount}">${pretty(expense.amount)}</data>
    <span class="creditor">paid by ${expense.creditor}</span>
    <time date="${expense.date}">${(new Date(expense.date)).toDateString().slice(0, -5)}</time>
  </li>`
}

export function onSettleUpClick (event) {
  event.preventDefault()
  const target = event.target
  const debt = JSON.parse(event.target.getAttribute("data"))
  const settlement = {
    amount: debt.amount,
    date: (new Date()).toISOString().substr(0, 10),
    creditor: debt.debtor,
    participants: [ debt.creditor ],
    title: "Settlement"
  }
  dispatch(target, 'app:postcommand', { command: 'add_expense', data: settlement })
  target.addEventListener('app:http_request_stop', () => {
    dispatch(target, 'app:sync')
    goTo('/trip/expenses')
  }, { once: true })
}
