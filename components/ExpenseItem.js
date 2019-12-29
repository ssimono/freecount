import {pretty} from './utils.js'

export default function ExpenseItem (expense) {
  const li = document.createElement('LI')
  li.innerHTML = `
    <span class="title">${expense.title}</span>
    <data class="amount" value="${expense.amount}">${pretty(expense.amount)}</data>
    <span class="creditor">paid by ${expense.creditor}</span>
    <time date="${expense.date}">${(new Date(expense.date)).toDateString().slice(0, -5)}</time>
  `

  return li
}
