import { dispatch, html } from '../lib.js'

export default class JsonForm extends HTMLElement {
  connectedCallback () {
    // Use a nested form element to circumvent the lack of customized built-in elements in Safari
    const form = html`<form data-name="${this.getAttribute('name')}">`

    form.innerHTML = this.innerHTML
    while (this.firstChild) {
      this.removeChild(this.firstChild)
    }

    this.appendChild(form)

    this.addEventListener('submit', submitHandler(
      this.validate.bind(this),
      this.format.bind(this)
    ))

    this._form = form
  }

  validate (payload) {
    return []
  }

  format (payload) {
    return payload
  }

  static showErrors (form, errors) {
    const generic = errors.filter(e => !e.name)
    const specific = errors.filter(e => !!e.name)

    for (const err of specific) {
      const inputs = form.querySelectorAll(`[name="${err.name}"]`)
      if (!inputs.length) {
        generic.push(err)
        continue
      }

      for (const input of inputs) {
        input.setCustomValidity(err.error)
        input.addEventListener(
          'change',
          () => clearErrors(input.form, input.getAttribute('name')),
          { once: true }
        )
      }
    }

    const errorContainer = form.querySelector('.errors')
    if (errorContainer && generic.length) {
      errorContainer.innerText = generic.map(e => e.error).join(' — ')
      form.addEventListener('change', () => {
        errorContainer.innerText = ''
      }, { once: true })
    } else if (generic.length) {
      alert(generic.map(e => e.error).join(' — '))
    }
  }
}

function submitHandler (validator, formatter) {
  return event => {
    event.preventDefault()
    const form = event.target
    const payload = getFormData(form)
    const errors = validator(payload)
    const focused = document.activeElement

    // Do not leave focus on form elements after submission
    if(focused && focused.getAttribute('type') !== 'submit') {
      focused.blur()
    }

    if (errors.length) {
      JsonForm.showErrors(form, errors)
    } else {
      dispatch(
        form,
        `app:submit_${event.target.dataset.name}`,
        formatter(payload)
      )
    }
  }
}

function clearErrors (form, name) {
  for (const input of form.querySelectorAll(`[name="${name}"]`)) {
    input.setCustomValidity('')
  }
}

function getFormData (form) {
  const formData = new FormData(form)

  return Array.from(formData.entries()).reduce((map, [k, v]) => {
    if (k.substr(-2) === '[]') {
      const key = k.substr(0, k.length - 2)
      if (key in map) {
        return Object.assign(map, { [key]: [...map[key], v] })
      } else {
        return Object.assign(map, { [key]: [v] })
      }
    } else {
      return Object.assign(map, { [k]: v })
    }
  }, Object.create(null))
}
