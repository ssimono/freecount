import { sha256 } from '../lib.js'
import JsonForm from './JsonForm.js'

export default class PasswordForm extends JsonForm {
  connectedCallback () {
    super.connectedCallback()
    this.addEventListener('app:forbidden', onForbidden)
  }

  format (passwordInput) {
    return sha256(passwordInput.password)
  }
}

function onForbidden ({ detail }) {
  JsonForm.showErrors(this._form, [{ error: detail }])
}
