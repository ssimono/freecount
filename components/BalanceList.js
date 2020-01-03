import {html} from '../lib.js'
import {pretty} from './utils.js'

export default class BalanceList extends HTMLUListElement {
  constructor() {
    super()
    this.state = new Map()
  }

  setMembers(members) {
    this.state.clear()
    for (let m of members) {
      this.state.set(m, 0)
    }
  }

  onNewExpense({creditor, participants, amount}) {
    if (!participants.length) {
      return
    }

    const balances = this.state
    const nAmount = Number(amount)
    const share = nAmount / participants.length

    balances.set(creditor, balances.get(creditor) + nAmount)

    for (let p of participants) {
      balances.set(p, balances.get(p) - share)
    }
  }

  render() {
    const balances = this.state
    const max = Math.max(...Array.from(balances.values()).map(b => Math.abs(b)))

    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    for(let [member, balance] of balances) {
      this.append(balanceItem(max, member, balance))
    }
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
