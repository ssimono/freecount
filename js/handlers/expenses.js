import {dispatch, goTo, html} from '../lib.js'
import {pretty} from './utils.js'

export function onTripReady({target, detail}) {
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

export function onNewExpense({detail}) {
  document.getElementById('expense_list').prepend(expenseItem(detail))
}

export function onAddExpenseFormOpen({target}) {
  const titleInput = target.querySelector('form [name="title"]')
  const dateInput = target.querySelector('form [name="date"]')

  if (!titleInput.value) {
    titleInput.focus()
  }

  if (!dateInput.value) {
    dateInput.value = (new Date()).toISOString().substr(0, 10)
  }
}

export function initTrip({target, detail}) {
  dispatch(target, 'app:postcommand', { command: 'init_trip', data: detail })
}

export function addExpense({target, detail}) {
  dispatch(target, 'app:postcommand', { command: 'add_expense', data: detail })
  target.addEventListener(
    'app:did_add_expense',
    () => goTo('/trip/expenses'),
    { once:true }
  )
}

function expenseItem (expense) {
  return html `<li>
    <span class="title">${expense.title}</span>
    <data class="amount" value="${expense.amount}">${pretty(expense.amount)}</data>
    <span class="creditor">paid by ${expense.creditor}</span>
    <time date="${expense.date}">${(new Date(expense.date)).toDateString().slice(0, -5)}</time>
  </li>`
}
