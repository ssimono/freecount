import { deriveKey, html } from '../lib.js'
import JsonForm from './JsonForm.js'

export default class PasswordInputForm extends JsonForm {
  constructor () {
    super()
    this.append(
      html`<h3>This freecount is password protected</h3>`,
      html`<label for="password_input_password">Password</label>`,
      html`<input type="password" id="password_input_password" name="password" required />`,
      html`<input type="submit" value="Open the freecount" />`,
      html`<div class="errors"></div>`
    )
  }

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
