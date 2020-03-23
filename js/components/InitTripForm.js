import JsonForm from './JsonForm.js'
import { dispatch, html, sha256 } from '../lib.js'

const MIN_MEMBERS = 2

export default class InitTripForm extends JsonForm {
  connectedCallback () {
    super.connectedCallback()
    this.querySelector('.members').addEventListener('item-list:update', onMembersUpdate)
    this.querySelector('#init_trip_password_toggle').addEventListener('change', onPasswordToggle)
  }

  validate (initTrip) {
    const uniqueMembers = new Set(initTrip.members)
    if (uniqueMembers.size !== initTrip.members.length) {
      return [{ error: 'It looks like some people have the same name, please adjust' }]
    }

    return []
  }
}

function onMembersUpdate ({ target, detail }) {
  target.classList.toggle('minimum-count', detail <= MIN_MEMBERS)
}

function onPasswordToggle ({ target }) {
  const form = target.form
  const passwordSection = form.querySelector('.password-control')

  if (target.checked && !passwordSection) {
    const passwordField = html`<input id="init_trip_password" type="password" required/>`

    form.insertBefore(
      html`<div class="password-control form-like">
            <label for="init_trip_password">Password</label>
            ${passwordField}
            <small>All your data will be end-to-end encrypted with this password. Share it with the participants and don't lose it. Freecount can't recover it.</small>
          </div>`,
      target.parentNode.nextSibling
    )
    passwordField.addEventListener('change', onPasswordChange)
  } else if (!target.checked && passwordSection) {
    dispatch(form, 'app:encryptionkeyupdate', null)
    form.removeChild(passwordSection)
  }
}

function onPasswordChange (event) {
  dispatch(event.target, 'app:encryptionkeyupdate', sha256(event.target.value))
}
