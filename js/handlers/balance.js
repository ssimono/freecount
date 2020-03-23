import { html, partition } from '../lib.js'
import { pretty } from './utils.js'

export function onNewExpense ({ detail }) {
  const balanceList = document.getElementById('balance_list')
  _onNewExpense({ target: balanceList, detail })
}

export function onInitTrip ({ detail }) {
  const balanceList = document.getElementById('balance_list')
  _onInitTrip({ target: balanceList, detail })
}

function _onInitTrip ({ target, detail }) {
  const balances = new Map()
  for (const m of detail.members) {
    balances.set(m, 0)
  }

  render(target, balances)
  target.cache = balances
}

function _onNewExpense ({ target, detail }) {
  const { creditor, participants, amount } = detail

  if (!participants.length) {
    return
  }

  if (!target.cache) {
    target.cache = getBalanceMap(target)
  }

  const balances = target.cache
  const nAmount = Number(amount)
  const share = nAmount / participants.length

  balances.set(creditor, balances.get(creditor) + nAmount)
  for (const member of participants) {
    balances.set(member, balances.get(member) - share)
  }

  render(target, balances)
}

function getBalanceMap (target) {
  const balanceMap = new Map()
  for (const dt of target.querySelectorAll('dt')) {
    const dd = dt.nextElementSibling

    const member = dt.innerText
    const balance = Number(dd.dataset.value)

    balanceMap.set(member, balance)
  }

  return balanceMap
}

function render (target, balances) {
  while (target.firstChild) target.removeChild(target.firstChild)

  let max = 1

  for (const [member, balance] of balances) {
    const className = balance >= 0 && 'positive' || 'negative'
    target.append(
      html`<dt class="${className}">${member}</dt>`,
      html`<dd data-value="${balance}" style="--balance: ${parseInt(balance)}" class="${className}">${pretty(balance, true)}</dd>`
    )
    max = Math.max(max, balance)
  }

  target.style.setProperty('--max', parseInt(max))

  renderDebts(target.nextElementSibling, computeDebts(balances))
}

function renderDebts (target, debts) {
  target.classList.toggle('fed', !!debts.length)
  const makeDebt = debt => html`
    <li>
      <em>${debt.debtor}</em>
      gives <strong><data value="${debt.amount}">${pretty(debt.amount)}</data></strong>
      to <em>${debt.creditor}</em>
    </li>`

  target.removeChild(target.lastElementChild)
  target.append(html`<ul>${debts.map(makeDebt)}</ul>`)
}

export function computeDebts (balances) {
  const splitBalances = partition(
    ([name, amount]) => amount >= 0,
    Array.from(balances.entries())
  )

  const creditors = splitBalances.get(true) || []
  const debtors = (splitBalances.get(false) || [])
    .map(([name, amount]) => [name, Math.abs(amount)])

  const sortFunction = ([aName, aAmount], [bName, bAmount]) => bAmount - aAmount
  const debts = []

  while (creditors.length && debtors.length) {
    creditors.sort(sortFunction)
    debtors.sort(sortFunction)

    const [creditor, credit] = creditors[0]
    const [debtor, debt] = debtors[0]

    if (credit < debt) {
      debts.push({ creditor, debtor, amount: credit })
      creditors.shift()
      debtors[0][1] += credit
    } else if (credit > debt) {
      debts.push({ creditor, debtor, amount: debt })
      debtors.shift()
      creditors[0][1] -= debt
    } else {
      debts.push({ creditor, debtor, amount: debt })
      debtors.shift()
      creditors.shift()
    }
  }

  return debts
}
