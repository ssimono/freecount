import {html} from '../lib.js'
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
