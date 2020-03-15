import {dispatch, html} from '../lib.js'

export default class JsonForm extends HTMLElement {
  constructor() {
    super()
    // Use a nested form element to circumvent lack of customized built-in elements in Safari
    const form = html`<form data-name="${this.getAttribute('name')}">`

    while(this.firstChild) {
      form.appendChild(this.firstChild.cloneNode(true))
      this.removeChild(this.firstChild)
    }

    this.appendChild(form)
  }

  connectedCallback() {
    this.addEventListener('submit', submitHandler(
      this.validate.bind(this),
      this.format.bind(this),
    ))
  }

  validate(payload) {
    return []
  }

  format(payload) {
    return payload
  }
}

function submitHandler(validator, formatter) {
  return event => {
    event.preventDefault()
    const form = event.target
    const payload = getFormData(form)
    const errors = validator(payload)

    if (errors.length) {
      showErrors(form, errors)
    } else {
      dispatch(
        form,
        `app:submit_${event.target.dataset.name}`,
        formatter(payload)
      )
    }
  }
}

function showErrors(form, errors) {
  const generic = errors.filter(e => !e.name)
  const specific = errors.filter(e => !!e.name)

  for(let err of specific) {
    let inputs = form.querySelectorAll(`[name="${err.name}"]`)
    if (!inputs.length) {
      generic.push(err)
      continue
    }

    for(let input of inputs) {
      input.setCustomValidity(err.error)
      input.addEventListener(
        'change',
        () => clearErrors(input.form, input.getAttribute('name')),
        {once: true}
      )
    }
  }

    const errorContainer = form.querySelector('.errors')
    if (errorContainer && generic.length) {
      errorContainer.innerText = generic.map(e => e.error).join(' — ')
      form.addEventListener('change', () => errorContainer.innerText = '', {once: true})
    }
}

function clearErrors(form, name) {
  for(let input of form.querySelectorAll(`[name="${name}"]`)) {
    input.setCustomValidity('')
  }
}

function getFormData(form) {
  const formData = new FormData(form)
  const map = Object.create(null)

  return Array.from(formData.entries()).reduce((map, [k, v]) => {
    if (k.substr(-2) === '[]') {
      const key = k.substr(0, k.length - 2)
      if (key in map) {
        return Object.assign(map, {[key]: [...map[key], v]})
      } else {
        return Object.assign(map, {[key]: [v]})
      }
    } else {
      return Object.assign(map, {[k]: v})
    }
  }, Object.create(null))
}
