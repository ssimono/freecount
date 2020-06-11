import html, { fragment, raw } from '../js/html.js'

export default function testHtml () {
  test('safely creates nested DOM Elements', () => {
    const name = '<script>alert("you got hacked")</script>'
    const result = html`
      <p style="background-color: blue;">
        <span class="${'" onclick="alert("xss"'}">My span content</span>
        Hello ${name}...${1 + 4}<strong name="heading-${'5" malicious="l337'}">${'and welcome'}</strong>
      </p>`

    assert.equal(result.tagName, 'P')
    assert.equal(result.style.backgroundColor, 'blue')
    assert.equal(result.querySelector('strong').innerText, 'and welcome')
    assert.equal(result.querySelector('script'), null)
    assert.isTrue(result.innerText.indexOf('<script>') > 0)
    assert.equal(result.querySelector('strong').getAttribute('malicious'), null)
    assert.equal(result.querySelector('strong').getAttribute('name'), 'heading-5" malicious="l337')
  })

  test('inserts dynamic DOM elements', () => {
    const child = html`<span class="child">SPAN</span>`
    const parent = html`<p>Insert a ${child} here</p>`
    const grandParent = html`<div>${[parent, parent.cloneNode(true), parent.cloneNode(true)]}<div>`

    assert.equal(parent.querySelector('.child').innerText, 'SPAN')
    assert.lengthOf(grandParent.querySelectorAll('.child'), 3)
  })

  test('does not allow several root elements', () => {
    assert.throws(() => html`<header>Hello head</header><main>Hello main</main>`)
  })

  test('does not allow dynamic content in forbidden places', () => {
    assert.throws(() => html`<div><${'p'}>Hello</${'p'}></div>`)
    assert.throws(() => html`<script>console.log('${'hello'}')</script>`)
    assert.throws(() => html`<style>body { background-color: ${'yellow'}; }</style>`)
    assert.throws(() => html`<div onclick="${"alert('xss')"}">click me</div>`)
    assert.throws(() => html`<div onclick="do${() => alert('xss')}">click me</div>`)
    assert.throws(() => html`<a href="javascript:${'var i = 5'}">click here</a>`)
    assert.throws(() => html`<p style="background-color: ${'blue'};">I am blue</p>`)
  })

  test('binds event listeners', () => {
    let clicked = false
    const button = html`<button onclick=${() => { clicked = true }}>click</button>`
    button.dispatchEvent(new MouseEvent('click'))
    assert.isTrue(clicked)
  })

  test('handles raw input', () => {
    assert.throws(() => html`<div onclick="${"alert('xss')"}">click me</div>`)
    assert.doesNotThrow(() => html`<div onclick="${raw("alert('xss')")}">click me</div>`)
  })

  test('allows several root elements when using fragment', () => {
    const frag = fragment`<header>Hello head</header><main>Hello main</main>`
    assert.isTrue(frag instanceof DocumentFragment)
    assert.equal(frag.children.length, 2)
  })

  test('can interpolate html within fragments', () => {
    const main = html`<main>Hello main</main>`
    const frag = fragment`<header>Hello head</header>${main}`
    assert.isTrue(frag instanceof DocumentFragment)
    assert.equal(frag.children.length, 2)
  })
}
