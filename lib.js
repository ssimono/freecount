export function dispatch(target, name, payload) {
  const event = new CustomEvent(name, { detail: payload, bubbles: true })
  window.setTimeout(() => target.dispatchEvent(event), 0)
}

export function parseRoutes(strRoutes) {
  return strRoutes
    .map(([def, handler]) => [def.split(/(=>|->)/).filter(Boolean), handler, def])
    .map(([tokens, handler, strRoute]) => {
      if (!tokens.length) {
        console.error(`Invalid route: "${strRoute}"`)
        return null
      }

      const shift = tokens => tokens.shift().trim()
      const route = {eventType: shift(tokens), selector: null, delegatedSelector: null, handler}

      while(tokens.length) {
        const token = shift(tokens)
        switch(token.trim()) {
          case '=>':
            route.selector = shift(tokens)
            break
          case '->':
            route.delegatedSelector = shift(tokens)
            break
          default:
            console.error('Invalid route: ', strRoute)
            return null
        }
      }

      return route
    })
    .filter(Boolean)
}

export function attachRoutes(strRoutes, root) {
  const routes = parseRoutes(strRoutes)

  for (let [eventType, eventRoutes] of partition('eventType', routes)) {
    for(let [selector, selectorRoutes] of partition('selector', eventRoutes)) {
      const targets = selector === null
        ? [root]
        : document.querySelectorAll(selector)

      // Attach direct handlers
      selectorRoutes
      .filter(({delegatedSelector}) => delegatedSelector === null)
      .forEach(({handler}) => {
        for(let element of targets) {
          element.addEventListener(eventType, handler)
        }
      })

      // Attach delegated handlers

      const delegatedRoutes = selectorRoutes
        .filter(({delegatedSelector}) => delegatedSelector !== null)

      const combinedHandler = routes => event => {
        for (let {delegatedSelector, handler} of routes) {
          if(event.target.matches(delegatedSelector)) {
            handler(event)
          }
        }
      }

      for(let element of targets) {
        element.addEventListener(eventType, combinedHandler(delegatedRoutes))
      }
    }
  }
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

export function partition(predicate, values) {
  const pred = typeof predicate === 'string'
    ? v => v[predicate]
    : predicate

  const map = new Map()
  for(let v of values) {
    const key = pred(v)
    if (map.has(key)) {
      map.get(key).push(v)
    } else {
      map.set(key, [v])
    }
  }

  return map
}
