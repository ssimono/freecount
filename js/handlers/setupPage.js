import {html} from '../lib.js'

export function showKnownTrips({target, detail}) {
  const tripNames = Object.getOwnPropertyNames(detail)
  if (!tripNames.length) {
    return
  }
  const paragraph = target.querySelector('.known-trips')
  const tripItems = tripNames.map(name =>
    html`<li><a title="Open ${name}" href="./?box=${detail[name]}">${name}</a></li>`
  )

  paragraph.querySelector('ul').append(...tripItems)
  paragraph.style.setProperty("display", 'block')
}
