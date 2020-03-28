import { html } from '../lib.js'

export default function notify({message, controls, callback}) {
  const notification = html`<div role="modal" class="notification">
    <p>${message}</p>
    ${controls.map(control => html`<button type="button">${control}</button>`)}
  </div>`

  if (callback) {
    notification.addEventListener('click', ({target, currentTarget}) => {
      if(target.tagName === 'BUTTON') {
        callback(target.innerText)
        currentTarget.parentNode.removeChild(currentTarget)
      }
    })
  }

  return notification
}

export function showNotification(props) {
  return new Promise((resolve) => {
    document.body.append(notify({...props, callback:resolve}))
  })
}

notify.style = `
.notification {
  --space-around: 0.5rem;
  background-color: var(--tertiary);
  bottom: 0;
  color: var(--headline);
  display: flex;
  padding: 1em 0;
  position: absolute;
  width: 100%;
}

.notification p {
  align-self: center;
  flex-grow: 1;
  margin-left: var(--space-around);
}
.notification button {
  align-self: center;
  height: max-content;
  margin-right: var(--space-around);
  padding: 8px;
}

@media(min-width: 800px) {
  .notification {
    border-radius: 1rem;
    bottom: unset;
    height: 100px;
    opacity: 0.95;
    padding: 1em;
    right: 5%;
    top: 5%;
    width: 350px;
  }
}
`
