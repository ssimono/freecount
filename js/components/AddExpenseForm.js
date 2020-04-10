import { dispatch, goTo, html } from '../lib.js'

export default function AddExpenseForm (members) {
  const form = html`
  <json-form class="add-expense" name="add_expense">
    <label for="add_expense_title">Title</label>
    <input type="text" id="add_expense_title" name="title" autocomplete="off" required/>

    <label for="add_expense_amount">Amount (EUR)</label>
    <input type="number" id="add_expense_amount" name="amount" step="0.01" required/>

    <div class="checkable-group">
      <label>Paid by</label>
      <div id="creditor_choice"></div>
    </div>

    <div class="checkable-group">
      <label>Applies to</label>
      <div id="participants_choice"></div>
    </div>

    <label for="add_expense_date">Date</label>
    <input type="date" id="add_expense_date" name="date" required/>
    <input type="hidden" name="currency" value="EUR" />

    <p class="errors"></p>

    <input type="submit" name="submit" value="Add" />
    <button type="button" title="Cancel" to="expenses" class="cancel">Cancel</button>
  </json-form>`

  // Can't simply use a map with the template because it would need to be flattended
  // TODO support this usecase in the html function
  const creditorChoice = form.querySelector('#creditor_choice')
  const participantsChoice = form.querySelector('#participants_choice')
  members.forEach((member, idx) => {
    creditorChoice.append(
      html`<input type="radio" name="creditor" id="add_expense_creditor_${idx}" value="${member}" required></input>`,
      html`<label for="add_expense_creditor_${idx}">${member}</label>`
    )

    participantsChoice.append(
      html`<input type="checkbox" name="participants[]" id="add_expense_participant_${idx}" value="${member}" checked></input>`,
      html`<label for="add_expense_participant_${idx}">${member}</label>`
    )
  })

  form.validate = validate
  form.format = format

  return form
}

function validate (newExpense) {
  if (Number.isNaN(Number(newExpense.amount))) {
    return [{ name: 'amount', error: 'Invalid amount. Please enter a valid number' }]
  }

  if (!newExpense.participants || !newExpense.participants.length) {
    return [{ error: 'Please choose who this expense applies to' }]
  }

  return []
}

function format (newExpense) {
  return Object.assign({}, newExpense, { amount: Number(newExpense.amount) })
}
