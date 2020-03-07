import {html} from '../lib.js'

export default class InputList extends HTMLElement {
  constructor() {
    super()
    const addLabel = this.getAttribute('add-label') || 'Add'
    this.template = this.querySelector('template')
    this.addButton = html`<button type="button" class="add">${addLabel}</button>`
    this.append(this.addButton)

    for(let i = 0 ; i < parseInt(this.getAttribute('min-items') || '0') ; ++i) {
      addItem(this)
    }
  }

  connectedCallback() {
    this.addEventListener('click', ({target}) => {
      if (target.classList.contains('add')) addItem(this)
      if (target.classList.contains('remove')) removeItem(this, target)
    })
  }
}

function addItem(inputList) {
  const newItem = inputList.template.cloneNode(true).content.firstElementChild
  const removeButton = html`<button type="button" class="remove">×</button>`

  const itemCount = inputList.querySelectorAll('.remove').length
  const minimum = parseInt(inputList.getAttribute('min-items') || '0')

  if (itemCount < minimum) {
    newItem.classList.add('permanent')
    removeButton.setAttribute('disabled', true)
  }

  inputList.insertBefore(removeButton, inputList.addButton)
  inputList.insertBefore(newItem, removeButton)
}

function removeItem(inputList, removeButton) {
  const parent = removeButton.parentNode
  parent.removeChild(removeButton.previousElementSibling)
  parent.removeChild(removeButton)
}
