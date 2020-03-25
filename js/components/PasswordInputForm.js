import { deriveKey } from '../lib.js'
import JsonForm from './JsonForm.js'

export default class PasswordForm extends JsonForm {
  connectedCallback () {
    super.connectedCallback()
    this.addEventListener('app:forbidden', onForbidden)
  }

  format (passwordInput) {
    return deriveKey(passwordInput.password)
  }
}

function onForbidden ({ detail }) {
  JsonForm.showErrors(this._form, [{ error: detail }])
}
