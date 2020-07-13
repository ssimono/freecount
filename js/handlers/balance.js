import { dispatch, generateId, goTo, html, partition, raw } from '../lib.js'
import { localPretty } from './utils.js'

export function onInitTrip (target, detail) {
  const balances = new Map()
  for (const m of detail.members) {
    balances.set(m, 0)
  }

  render(target, balances)
  target.cache = balances
}

export function onNewExpense (target, expense) {
  const { creditor, participants, amount } = expense

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

export function onSettleUpClick ({ target, detail }) {
  const settlement = {
    id: generateId(16),
    amount: detail.amount,
    date: (new Date()).toISOString().substr(0, 10),
    creditor: detail.debtor,
    participants: [ detail.creditor ],
    title: "⚖ Settlement"
  }
  target.addEventListener('http_request_stop', () => {
    dispatch(target, 'sync')
  }, { once: true })
  dispatch(target, 'app:postcommand', { command: 'add_expense', data: settlement })
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
      html`<dd data-value="${balance}" style="--balance: ${raw(parseInt(balance))}" class="${className}">${localPretty(balance, true)}</dd>`
    )
    max = Math.max(max, balance)
  }

  target.style.setProperty('--max', parseInt(max))

  renderDebts(target.nextElementSibling, computeDebts(balances))
}

function renderDebts (target, debts) {
  target.classList.toggle('fed', !!debts.length)

  const makeDebt = debt => {
    const t = html`
    <li>
      <em>${debt.debtor}</em>
      gives <strong><data value="${debt.amount}">${localPretty(debt.amount)}</data></strong>
      to <em>${debt.creditor}</em>
      <button title="Settle up" role="button">Settle up</button>
    </li>`
    const button = t.lastElementChild
    button.addEventListener('click', () => {
      dispatch(t, 'settle_up', debt)
    })
    return t
  }

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
      debtors[0][1] -= credit
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
