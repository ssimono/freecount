export function dispatch(target, name, payload) {
  const event = new CustomEvent(name, { detail: payload, bubbles: true })
  window.setTimeout(() => target.dispatchEvent(event), 0)
}

export function parseRoutes(strRoutes) {
  return strRoutes
  .map(([def, handler]) => {
    const [eventType, strategy, selector] = def.split(/([\-=]>)/).map(s => s.trim())
    return {eventType, selector, handler, strategy}
  })
  .filter(({selector}) => !!selector)
}

export function attachRoutes(strRoutes, root) {
  const routes = parseRoutes(strRoutes)

  // Attach direct routes
  routes
  .filter(({strategy}) => strategy === '=>')
  .forEach(({eventType, selector, handler}) => {
    for(let element of root.querySelectorAll(selector)) {
      element.addEventListener(eventType, handler)
    }
  })

  // Attach delegated routes
  routes
  .filter(({strategy}) => strategy === '->')
  .reduce((perType, {eventType, selector, handler}) => {
    if (perType.has(eventType)) {
      perType.get(eventType).push({selector, handler})
    } else {
      perType.set(eventType, [{selector, handler}])
    }
    return perType
  }, new Map())
  .forEach((routes, eventType) => {
    root.addEventListener(eventType, (event) => {
      const target = event.target
      for(let {selector, handler} of routes) {
        if (target.matches(selector)) {
          handler(event)
          break
        }
      }
    })
  })
}

// From https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
export function generateId (len) {
  const dec2hex = dec => ('0' + dec.toString(16)).substr(-2)
  const arr = new Uint8Array((len || 40) / 2)

  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}

export function goTo(newPath) {
  const toShow = []
  for(
    let page = document.querySelector(`[path="${newPath}"]`);
    page !== null;
    page = page.parentElement.closest('[path]')
  ) { toShow.push(page) }

  const toKeep = new Set(toShow.map(p => p.getAttribute('path')))

  for(let toHide of document.querySelectorAll('[path].active')) {
    if (!toKeep.has(toHide.getAttribute('path'))) {
      toHide.classList.remove('active')
    }
  }

  for (let page of toShow) {
    page.classList.add('active')
  }

  if (toShow.length) {
    const lastPage = toShow[0]
    dispatch(lastPage, 'app:navigate', lastPage.getAttribute('path'))
  }
}
