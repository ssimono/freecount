import { fragment } from '../lib.js'

export default class ItemList extends HTMLElement {
  connectedCallback () {
    this.addEventListener('click', clickHandler)

    const currentCount = this.querySelectorAll('.item').length
    const desiredCount = this.getIntAttribute('init-items')

    for (let i = currentCount; i < desiredCount; ++i) {
      this.addItem()
    }
  }

  getIntAttribute (name) {
    return parseInt(super.getAttribute(name) || '0')
  }

  addItem () {
    const template = this.querySelector('template')
    const itemContent = template
      ? template.content.cloneNode(true).children
      : ''

    this.insertBefore(fragment`
      <div class="item">${itemContent}</div>
      <button type="button" class="remove">×</button>`,
      this.querySelector('.add')
    )
  }
}

function clickHandler ({ target, currentTarget }) {
  let itemCount = currentTarget.querySelectorAll('.item').length

  if (target.classList.contains('add')) {
    currentTarget.addItem(currentTarget)
    itemCount++
  } else if (target.classList.contains('remove')) {
    currentTarget.removeChild(target.previousElementSibling)
    currentTarget.removeChild(target)
    itemCount--
  }

  currentTarget.dispatchEvent(new CustomEvent('item-list:update', { detail: itemCount }))
}
