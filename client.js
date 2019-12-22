import {dispatch} from '../lib.js'

export default class Client {
  constructor(anchor, boxId, endpoint = 'https://jsonbox.io') {
    this.anchor = anchor
    this.boxId = boxId
    this.endpoint = endpoint
    this.url = `${endpoint}/${boxId}`
  }

  async getExpenses() {
    const response = await fetch(this.url)
    return await response.json()
  }

  async addExpense(newExpense) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense)
    })
    return await response.json()
  }

  async do(request) {
    // jsonbox seems to sort by date DESC by default
    const response = await fetch(`${this.url}?sort=-age`, request)
    const status = response.status

    if (status >= 200 && status < 400) {
      const json = await response.json();
      [].concat(json).forEach(payload => {
        dispatch(this.anchor, `app:did_${payload.command}`, payload.data)
      })
    } else if (status >= 400 && status < 500) {
      const json = await response.json()
      throw new Error(`Got error ${status}: ${json.message}`)
    } else {
      throw new Error(`Got error ${status}`)
      console.error(response)
    }
  }
}
