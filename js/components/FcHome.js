import { attachRoutes, dispatch, deriveKey, fragment, html } from '../lib.js'

import InitTripForm from './InitTripForm.js'

export default class FcHome extends HTMLElement {
  connectedCallback () {
    this.append(initState())
    attachRoutes([
      ['jsonsubmit -> [name="init_trip"]', onInitTripSubmit],
      ['change -> #init_trip_password', onPasswordChange],
      ['change -> #init_trip_password_toggle', onPasswordToggle],
      ['local:knowntrips', onKnownTripsLoaded]
    ], this)

    dispatch(this, 'local:fetch')
  }
}

const initState = () => fragment`
  <h2>Let's start a trip</h2>
  ${InitTripForm()}
  <div class="known-trips">
    <h3>Previous trips</h3>
    <ul></ul>
  </div>
  <footer>
    <span>&nbsp;</span>
    <a href="https://github.com/ssimono/freecount" title="Freecount's source code">About</a>
  </footer>
`

function onInitTripSubmit ({ target, detail }) {
  dispatch(target, 'app:postcommand', { command: 'init_trip', data: detail })
}

function onPasswordChange ({ target }) {
  dispatch(target, 'app:encryptionkeyupdate', deriveKey(target.value))
}

function onPasswordToggle ({ target }) {
  if (!target.checked) {
    dispatch(form, 'app:encryptionkeyupdate', null)
  }
}

function onKnownTripsLoaded ({ target, detail }) {
  const dest = target.querySelector('.known-trips')
  const boxIds = Object.getOwnPropertyNames(detail)
  if (!boxIds.length) {
    return
  }

  const items = boxIds
    .map(boxId => [boxId, detail[boxId]])
    .filter(([id, { title }]) => !!title)
    .map(([id, { title }]) =>
      html`<li><a title="Open ${title}" href="./?box=${id}">${title}</a></li>`
    )

  dest.querySelector('ul').append(...items)
  dest.style.setProperty('display', 'block')
}
