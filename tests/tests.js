import {parseRoutes} from '../lib.js'

export default function () {
  testParseRoutes()
}

function testParseRoutes() {
  testCase('parse routes')

  const tests = [
    ['submit => form', null],
    ['submit -> form', null],
    ['click => form.active input', null],
    ['invalid', null]
  ]

  const routes = parseRoutes(tests)
  const serialized = routes.map(r => JSON.stringify(r))

  it('parses routes', () => {
    assert(routes.length === 3)

    assert(routes[0].eventType === 'submit')
    assert(routes[1].eventType === 'submit')
    assert(routes[2].eventType === 'click')

    assert(routes[0].strategy === '=>')
    assert(routes[1].strategy === '->')
    assert(routes[2].strategy === '=>')

    assert(routes[0].selector === 'form')
    assert(routes[1].selector === 'form')
    assert(routes[2].selector === 'form.active input')
  })
}

function assert(predicate) {
  if (predicate) return true
  else throw new Error('Bad assumption')
}

function it(title, fn) {
  const result = {title, success:true}

  try {
    fn()
  } catch (e) {
    result.success = false
    if (e.message === 'Bad assumption') {
      result.error = e.stack.split('\n')[1]
    } else {
      result.error = e.message
    }
    console.error(e)
  }

  const li = document.createElement('li')
  if (result.success) {
    li.classList.add('success')
  } else {
    li.classList.add('failure')
  }
  li.innerHTML = result.title + (result.error ? `<span class="error">${result.error}</span>` : '')

  document.querySelector('.test-case:last-of-type').append(li)
}

function testCase(title) {
  const main = document.querySelector('main')
  const h2 = document.createElement('h2')
  const ul = document.createElement('ul')
  h2.innerText = title
  ul.classList.add('test-case')

  main.append(h2, ul)
}
