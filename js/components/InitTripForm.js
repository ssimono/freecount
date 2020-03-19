import JsonForm from './JsonForm.js'

const MIN_MEMBERS = 2

export default class InitTripForm extends JsonForm {
  connectedCallback() {
    super.connectedCallback()
    this.querySelector('.members').addEventListener('item-list:update', onMembersUpdate)
  }
}

function onMembersUpdate({target, detail}) {
  target.classList.toggle('minimum-count', detail <= MIN_MEMBERS)
}
