import { html } from '../lib.js'

const MIN_MEMBERS = 2

export default function InitTripForm () {
  const form = html`
    <json-form name="init_trip" class="init-trip">
      <label for="init_trip_name">Trip name</label>
      <input type="text" id="init_trip_name" name="name" autocomplete="off" required/>
      <input type="hidden" name="currency" value="EUR" readonly/>
      <label>Who's joining?</label>
      <item-list init-items="2" class="members minimum-count" onItem-list:update=${onMembersUpdate}>
        <template>
          <input type="text" name="members[]" placeholder="Put a name here" minlength="1" required/>
        </template>
        <button type="button" class="add">+</button>
      </item-list>
      <div class="toggle">
        <label for="init_trip_password_toggle">Protect by password</label>
        <input type="checkbox" id="init_trip_password_toggle" onChange=${onPasswordToggle} />
      </div>
      <div class="errors"></div>
      <input type="submit" name="submit" value="Go!"/>
    </json-form>`

  form.validate = validate

  return form
}

InitTripForm.style = `
.init-trip .item input {
  margin-bottom: 0;
  width: 100%;
}`

function validate (initTrip) {
  const uniqueMembers = new Set(initTrip.members)
  if (uniqueMembers.size !== initTrip.members.length) {
    return [{ error: 'It looks like some people have the same name, please adjust' }]
  }

  return []
}

function onMembersUpdate ({ target, detail }) {
  target.classList.toggle('minimum-count', detail <= MIN_MEMBERS)
}

function onPasswordToggle ({ target }) {
  const form = target.form
  const passwordSection = form.querySelector('.password-control')

  if (target.checked && !passwordSection) {
    form.insertBefore(
      html`<div class="password-control form-like">
            <label for="init_trip_password">Password</label>
            <input id="init_trip_password" type="password" required/>
            <small>All your data will be end-to-end encrypted with this password. Share it with the participants and don't lose it. Freecount can't recover it.</small>
          </div>`,
      target.parentNode.nextSibling
    )
  } else if (!target.checked && passwordSection) {
    form.removeChild(passwordSection)
  }
}
