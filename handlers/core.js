import {dispatch} from '../lib.js'

/**
 * Parses a submitted form and emit an event with the content as Object
 */
export function parseForm({target}) {
  event.preventDefault()
  const formData = new FormData(target)
  const map = Object.create(null)
  for(let [k, v] of formData.entries()) {
    if (k.substr(-2) === '[]') {
      const key = k.substr(0, k.length - 2)
      if (key in map) {
        map[key].push(v)
      } else {
        map[key] = [v]
      }
    } else {
      map[k] = v
    }
  }

  dispatch(target, `app:submit_${target.getAttribute('name')}`, map)
}

/**
 * Toggle "active" class on menu items as they get selected
 */
export function updateMenu({target, currentTarget}) {
  const activeItem = currentTarget.querySelector('[to].active')

  if (target === activeItem) {
    return
  }

  if (activeItem) {
    activeItem.classList.remove('active')
  }

  target.classList.add('active')
}

/**
 * Handles interaction with dynamic list of items
 */
export function handleListGroup(event) {
  const {target, currentTarget, key, type} = event
  if (type === 'click' && target.classList.contains('add')) {
    const list = currentTarget.querySelector('ul')
    const input = list.querySelector('.adder input')
    const value = input.value.trim()
    const prop = currentTarget.getAttribute('name')

    const newItem = document.createElement('li')
    newItem.classList.add('item')
    newItem.innerHTML =
      `<span>${value}</span>
       <button type="button" class="remove" title="remove item">×</button>
       <input type="hidden" name="${prop}[]" value="${value}"/>`

    input.value = ''
    input.focus()

    list.append(newItem)
  } else if (target.classList.contains('remove')) {
      target.closest('li').remove()
  } else if (type === 'keypress') {
    if (target.tagName === 'INPUT' && key === 'Enter') {
      event.preventDefault()
      handleListGroup({
        currentTarget,
        target: currentTarget.querySelector('.add'),
        type: 'click'
      })
    }
  }
}
