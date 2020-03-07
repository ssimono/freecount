import {dispatch, html} from '../lib.js'

export default class JsonForm extends HTMLElement {
  constructor() {
    super()
    // Use a nested form element to circument lack of customized built-in elements in Safari
    const form = html`<form name="${this.getAttribute('name')}">`

    while(this.firstChild) {
      form.appendChild(this.firstChild.cloneNode(true))
      this.removeChild(this.firstChild)
    }

    this.appendChild(form)
  }

  connectedCallback() {
    this.addEventListener('submit', onSubmit)
  }
}

function onSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const map = Object.create(null)
  for(let [k, v] of formData.entries()) {
    if (k.substr(-2) === '[]') {
      const key = k.substr(0, k.length - 2)
      if (key in map) {
        map[key].push(v)
      } else {
        map[key] = [v]
      }
    } else {
      map[k] = v
    }
  }

  dispatch(event.target, `app:submit_${event.target.getAttribute('name')}`, map)
}
