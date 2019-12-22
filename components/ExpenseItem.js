import {pretty} from './utils.js'

export default function ExpenseItem (expense) {
  const li = document.createElement('LI')
  li.innerHTML = `
    <div class="meta">
      <data class="amount" value="${expense.amount}">${pretty(expense.amount)}</data><br>
      <time date="${expense.date}">${(new Date(expense.date)).toDateString().slice(0, -5)}</time>
    </div>
    ${expense.title}</span><br>
    <span class="creditor">paid by ${expense.creditor}</span>
  `

  return li
}
