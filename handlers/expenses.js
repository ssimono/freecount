import {dispatch, goTo, html} from '../lib.js'
import BalanceList from '../components/BalanceList.js'
import ExpenseItem from '../components/ExpenseItem.js'

export function onTripReady({target, detail}) {
  document.querySelector('h1').innerText = detail.name
  document.getElementById('expense_list').classList.add('ready')

  const creditorChoice = document.getElementById('creditor_choice')
  const participantsChoice = document.getElementById('participants_choice')
  const balanceList = document.getElementById('balance_list')

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

  balanceList.setMembers(detail.members)
  balanceList.render()
}

export function onNewExpense({detail}) {
  document.getElementById('expense_list').prepend(ExpenseItem(detail))
  const balanceList = document.getElementById('balance_list')
  balanceList.onNewExpense(detail)
  balanceList.render()
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
  goTo('/trip/expenses')
}

export function showKnownTrips({target, detail}) {
  const tripNames = Object.getOwnPropertyNames(detail)
  if (!tripNames.length) {
    return
  }
  const paragraph = target.querySelector('.known-trips')
  const tripItems = tripNames.map(name =>
    html`<li><a title="Open ${name}" href="./?box=${detail[name]}">${name}</a></li>`
  )

  paragraph.querySelector('ul').append(...tripItems)
  paragraph.style.setProperty("display", 'block')
}
