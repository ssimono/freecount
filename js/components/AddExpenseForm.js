import JsonForm from './JsonForm.js'

export default class AddExpenseForm extends JsonForm {
  validate(newExpense) {
    if (Number.isNaN(Number(newExpense.amount))) {
      return [{name: 'amount', error: 'Invalid amount. Please enter a valid number'}]
    }

    if (!newExpense.participants || !newExpense.participants.length) {
      return [{error: 'Please choose who this expense applies to'}]
    }

    return []
  }

  format(newExpense) {
    return Object.assign({}, newExpense, {amount: Number(newExpense.amount)})
  }
}
