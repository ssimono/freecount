import { html } from '../lib.js'

export function showKnownTrips ({ target, detail }) {
  const boxIds = Object.getOwnPropertyNames(detail)
  if (!boxIds.length) {
    return
  }
  const paragraph = target.querySelector('.known-trips')
  const items = boxIds
    .map(boxId => [boxId, detail[boxId]])
    .filter(([ id, {title} ]) => !!title)
    .map(([ id, {title} ]) =>
      html`<li><a title="Open ${title}" href="./?box=${id}">${title}</a></li>`
    )

  paragraph.querySelector('ul').append(...items)
  paragraph.style.setProperty('display', 'block')
}
