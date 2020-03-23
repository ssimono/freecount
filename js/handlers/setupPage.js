import { html } from '../lib.js'

export function showKnownTrips ({ target, detail }) {
  const boxIds = Object.getOwnPropertyNames(detail)
  if (!boxIds.length) {
    return
  }
  const paragraph = target.querySelector('.known-trips')
  const items = boxIds.map(boxId => {
    const item = detail[boxId]
    return html`<li><a title="Open ${item.title}" href="./?box=${boxId}">${item.title}</a></li>`
  })

  paragraph.querySelector('ul').append(...items)
  paragraph.style.setProperty('display', 'block')
}
