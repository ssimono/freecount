import {html, parseRoutes, partition} from '../lib.js'
import {validate} from '../client.js'

export default function () {
  testParseRoutes()
  testValidate()
  testPartition()
  testHtml()
}

function testParseRoutes() {
  testCase('parse routes')

  const tests = [
    ['click', null],
    ['submit => form', null],
    ['submit -> div.active', null],
    ['click => form.active -> button', null],
    [' ', null]
  ]

  const routes = parseRoutes(tests)
  const serialized = routes.map(r => JSON.stringify(r))

  it('parses routes', () => {
    assert(routes.length === 5)

    assert(routes[0].eventType === 'click')
    assert(routes[0].selector === null)
    assert(routes[0].delegatedSelector === null)

    assert(routes[1].eventType === 'submit')
    assert(routes[1].selector === 'form')
    assert(routes[1].delegatedSelector === null)

    assert(routes[2].eventType === 'submit')
    assert(routes[2].selector === null)
    assert(routes[2].delegatedSelector === 'div.active')

    assert(routes[3].eventType === 'click')
    assert(routes[3].selector === 'form.active')
    assert(routes[3].delegatedSelector === 'button')
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

function testPartition() {
  testCase('partition function')

  it('partitions', () => {
    const p1 = partition(n => n%2 === 0, [1,2,3,4,5,6])
    const p2 = partition(n => n%2 === 0, [2,1,3,4,5,6])

    assert(p1.size === 2)
    assert(p2.size === 2)

    assertValueEquals(p1.get(true), [2,4,6])
    assertValueEquals(p1.get(false), [1,3,5])
  })

  it('partitions by string', () => {
    const p1 = partition('age', [
      {name:'Dock', age: 34},
      {name:'Dopey', age: 35},
      {name:'Bashful', age: 12},
      {name:'Grumpy', age: 12},
      {name:'Sneezy', age: 17},
      {name:'Sleepy', age: 34},
    ])

    assert(p1.size === 4)

    assertValueEquals(p1.get(34).map(d => d.name), ['Dock', 'Sleepy'])
    assertValueEquals(p1.get(35).map(d => d.name), ['Dopey'])
    assertValueEquals(p1.get(12).map(d => d.name), ['Bashful', 'Grumpy'])
    assertValueEquals(p1.get(17).map(d => d.name), ['Sneezy'])
  })
}

function testHtml() {
  testCase('html escape function')
  it('works', () => {
    const name = '<script>alert("you got hacked")</script>'
    const result = html`
      <p>
        Hello ${name}...<strong name="heading-${'5" malicious="l337'}">${'and welcome'}</strong>
      </p>`

    assert(result.tagName === 'P')
    assert(result.querySelector('strong').innerText === 'and welcome')
    assert(result.querySelector('script') === null)
    assert(result.innerText.indexOf('<script>') > 0)
    assert(result.querySelector('strong').getAttribute('malicious') === null)
    assert(result.querySelector('strong').getAttribute('name') ==='heading-5" malicious="l337')
  })
}


function assert(predicate) {
  if (predicate) return true
  else throw new Error('Bad assumption')
}

function assertValueEquals(serializable, expected) {
  return assert(JSON.stringify(serializable) === JSON.stringify(expected))
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
