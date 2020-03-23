import { attachRoutes, html } from '../js/lib.js'

export default function testAttachRoutes () {
  let root = null
  let eventLog = new Map()
  const handler = name => event => {
    if (eventLog.has(name)) {
      eventLog.get(name).push(event.target.getAttribute('id'))
    } else {
      eventLog.set(name, [event.target.getAttribute('id')])
    }
  }

  setup(() => {
    root = html`
      <div id="root">
        <p id="a">
          <span id="aa">First link: </span><a id="ab" href="#">click here</a>…
        </p>
        <p id="b">
          <button id="ba">click here</button>
        </p>
        <div id="c">
          <p id="ca">Last paragraph</p>
        </div>
      </div>`

    document.body.append(root)
  })

  teardown(() => {
    document.body.removeChild(root)
    eventLog = new Map()
  })

  test('binds to the root by default', async () => {
    attachRoutes([
      ['click', handler(1)]
    ], root)

    root.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    assert.deepEqual(eventLog.get(1), ['root'])
  })

  test('can select listener', async () => {
    attachRoutes([
      ['click', handler(1)],
      ['click => #a', handler(2)],
      ['click => #b', handler(3)],
      ['click => p', handler(4)]
    ], root)

    root.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    root.querySelector('#a').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    root.querySelector('#b').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    root.querySelector('#ab').dispatchEvent(new MouseEvent('click', { bubbles: true }))

    assert.deepEqual(eventLog.get(1), ['root', 'a', 'b', 'ab'])
    assert.deepEqual(eventLog.get(2), ['a', 'ab'])
    assert.deepEqual(eventLog.get(3), ['b'])
    assert.deepEqual(eventLog.get(4), ['a', 'b', 'ab'], 'can bind a listener to multiple matching targets')
  })

  test('can delegate', async () => {
    attachRoutes([
      ['click => #b button', handler(1)],
      ['click -> #b button', (handler(2))],
      ['click => div -> p', handler(3)]
    ], root)

    root.querySelector('#b').append(html`<button id="bb">click here</button>`)

    root.querySelector('#ba').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    root.querySelector('#bb').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    root.querySelector('#ca').dispatchEvent(new MouseEvent('click', { bubbles: true }))

    assert.deepEqual(eventLog.get(1), ['ba'], 'static binding ignores dynamically inserted elements')
    assert.deepEqual(eventLog.get(2), ['ba', 'bb'], 'delegated binding does not')
    assert.deepEqual(eventLog.get(3), ['ca'], 'static can be combined with delegated')
  })
}
