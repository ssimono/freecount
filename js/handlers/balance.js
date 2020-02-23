import {html, partition} from '../lib.js'
import {pretty} from './utils.js'

export function onNewExpense({detail}) {
  const balanceList = document.getElementById('balance_list')
  _onNewExpense({target: balanceList, detail})
}

export function onInitTrip({detail}) {
  const balanceList = document.getElementById('balance_list')
  _onInitTrip({target: balanceList, detail})
}

function _onInitTrip({target, detail}) {
  target.state = new Map()
  target.state.clear()
  for (let m of detail.members) {
    target.state.set(m, 0)
  }

  renderBalances(target)
}

function _onNewExpense({target, detail}) {
  const {creditor, participants, amount} = detail

  if (!participants.length) {
    return
  }

  const balances = target.state
  const nAmount = Number(amount)
  const share = nAmount / participants.length

  balances.set(creditor, balances.get(creditor) + nAmount)

  for (let p of participants) {
    balances.set(p, balances.get(p) - share)
  }

  renderBalances(target)
}

function renderBalances(target) {
  const balances = target.state
  const max = Math.max(...Array.from(balances.values()).map(b => Math.abs(b)))

  while (target.firstChild) {
    target.removeChild(target.firstChild);
  }

  for(let [member, balance] of balances) {
    target.append(balanceItem(max, member, balance))
  }

  renderDebts(target.nextElementSibling, computeDebts(target.state))
}


function renderDebts(target, debts) {
  target.classList.toggle('fed', !!debts.length)
  const makeDebt = debt => html`
    <li>
      <em>${debt.debtor}</em>
      gives <data value="${debt.amount}">${pretty(debt.amount)}</data>
      to <em>${debt.creditor}</em>
    </li>`

  target.removeChild(target.lastElementChild);
  target.append(html`<ul>${debts.map(makeDebt)}</ul>`)
}

export function computeDebts(balances) {
  const splitBalances = partition(
    ([name, amount]) => amount >= 0,
    Array.from(balances.entries())
  )

  const creditors = splitBalances.get(true) || []
  const debtors = (splitBalances.get(false) || [])
    .map(([name, amount]) => [name, Math.abs(amount)])

  const sortFunction = ([aName, aAmount], [bName, bAmount]) => bAmount - aAmount
  const debts = []

  while(creditors.length && debtors.length) {
    creditors.sort(sortFunction)
    debtors.sort(sortFunction)

    const [creditor, credit] = creditors[0]
    const [debtor, debt] = debtors[0]

    if (credit < debt) {
      debts.push({creditor, debtor, amount: credit})
      creditors.shift()
      debtors[0][1] += credit
    } else if (credit > debt) {
      debts.push({creditor, debtor, amount: debt})
      debtors.shift()
      creditors[0][1] -= debt
    } else {
      debts.push({creditor, debtor, amount: debt})
      debtors.shift()
      creditors.shift()
    }
  }

  return debts
}

function balanceItem(max, member, balance){
    const positive = balance >= 0
    const ratio = Math.abs(balance) / Math.max(Math.abs(max, 1))

    return html`
      <li class="${positive ? 'positive':''}" style="--ratio: ${ratio*100}%;">
        <span class="member">${member}</span>
        <data class="balance" value="${balance}">${pretty(balance, true)}</data>
      </li>`
}
