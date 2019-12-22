import {parseRoutes} from '../lib.js'
import {validate} from '../client.js'

export default function () {
  testParseRoutes()
  testValidate()
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

function testValidate() {
  testCase('events validation')

  it('allows valid events', () => {
    assert(validate(
      {_id:"5dfe9cfa4c88c20017b0da51",command:"init_trip",data:{name:"Vacation Spain",currency:"EUR",members:["Chuck","Jacky","Bruce"]},version:1,_createdOn:"2019-12-21T22:30:18.724Z"},{_id:"5dff4ec789e555001711a1b2",command:"add_expense",data:{title:"First spend",amount:"32",creditor:"Simon",participants:["Simon","Pauline","Vincent"],date:"2019-12-22",currency:"EUR"},version:1,_createdOn:"2019-12-22T11:08:55.440Z"}
    ))
    assert(validate(
      {_id:"5dfff89989e555001711a344",command:"add_expense",data:{title:"Hello",amount:"543.7",creditor:"Chuck",participants:["Chuck","Bruce"],date:"2019-12-22",currency:"EUR"},version:1,_createdOn:"2019-12-22T23:13:29.784Z"}
    ))
  })

  it('disallows invalid events', () => {
    assertThrows(() => validate({}))
    assertThrows(() => validate({command: "unknown"}))
    assertThrows(() => validate({command: "init_trip", version: 4}))
    assertThrows(() => validate({command: "init_trip", _createdOn:"2019", data: null}))
    assertThrows(() => validate({command: "init_trip", _createdOn:"2019", data: {name: '', currency: 'chf', members: []}}))
  })
}

function assert(predicate) {
  if (predicate) return true
  else throw new Error('Bad assumption')
}

function assertThrows(fn) {
  try {
    fn()
  } catch (e) {
    return true
  }
  throw new Error('Should have thrown')
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
