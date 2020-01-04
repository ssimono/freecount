import {dispatch, html} from '../lib.js'

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
export function addItem(event) {
  const input = event.currentTarget.querySelector('.adder input')
  const value = input.value.trim()
  const prop = event.target.closest('.list-group').getAttribute('name')

  if (value.length < parseInt(input.getAttribute('minlength'), 10)) {
    event.preventDefault()
    return
  }

  const newItem = html`
    <li class="item">
      <span>${value}</span>
      <button type="button" class="remove" title="remove item">×</button>
      <input type="hidden" name="${prop}[]" value="${value}"/>
    </li>
  `

  input.value = ''
  input.focus()

  event.currentTarget.append(newItem)
}
export function removeItem({target}) {
  target.closest('li').remove()
}
