import aesjs from 'https://dev.jspm.io/npm:aes-js@3.1.2/index.js'
import fastSha from 'https://dev.jspm.io/npm:fast-sha256@1.3.0/sha256.min.js'

// Do not change this, unless you are self-hosting Freecount and do not want the
// data to be readable from another "instance"
const SALT = '3dca5d3ce9ce8aa0a47b390960c76625'

export function dispatch (target, name, payload) {
  if (payload instanceof Promise) {
    payload.then(load => dispatch(target, name, load)).catch(console.error)
    return
  }

  const event = new CustomEvent(name, { detail: payload, bubbles: true })
  setTimeout(() => target.dispatchEvent(event), 0)
}

function parseRoutes (strRoutes) {
  return strRoutes
    .map(([def, handler]) => [def.split(/(=>|->)/).filter(Boolean), handler, def])
    .map(([tokens, handler, strRoute]) => {
      if (!tokens.length) {
        console.error(`Invalid route: "${strRoute}"`)
        return null
      }

      const shift = tokens => tokens.shift().trim()
      const route = { eventType: shift(tokens), selector: null, delegatedSelector: null, handler }

      while (tokens.length) {
        const token = shift(tokens)
        switch (token.trim()) {
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

export function attachRoutes (strRoutes, root) {
  const routes = parseRoutes(strRoutes)

  for (const [eventType, eventRoutes] of partition('eventType', routes)) {
    for (const [selector, selectorRoutes] of partition('selector', eventRoutes)) {
      const targets = selector === null
        ? [root]
        : root.querySelectorAll(selector)

      // Attach direct handlers
      selectorRoutes
        .filter(({ delegatedSelector }) => delegatedSelector === null)
        .forEach(({ handler }) => {
          for (const element of targets) {
            element.addEventListener(eventType, handler)
          }
        })

      // Attach delegated handlers

      const delegatedRoutes = selectorRoutes
        .filter(({ delegatedSelector }) => delegatedSelector !== null)

      const combinedHandler = routes => event => {
        for (const { delegatedSelector, handler } of routes) {
          if (event.target.matches(delegatedSelector)) {
            handler(event)
          }
        }
      }

      for (const element of targets) {
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

export function goTo (newPath) {
  const toShow = []
  for (
    let page = document.querySelector(`[path="${newPath}"]`);
    page !== null;
    page = page.parentElement.closest('[path]')
  ) { toShow.push(page) }

  const toKeep = new Set(toShow.map(p => p.getAttribute('path')))

  for (const toHide of document.querySelectorAll('[path].active')) {
    if (!toKeep.has(toHide.getAttribute('path'))) {
      toHide.classList.remove('active')
    }
  }

  for (const page of toShow) {
    page.classList.add('active')
  }

  if (toShow.length) {
    const lastPage = toShow[0]
    dispatch(lastPage, 'app:navigate', lastPage.getAttribute('path'))
  }
}

export function partition (predicate, values) {
  const pred = typeof predicate === 'string'
    ? v => v[predicate]
    : predicate

  const map = new Map()
  for (const v of values) {
    const key = pred(v)
    if (map.has(key)) {
      map.get(key).push(v)
    } else {
      map.set(key, [v])
    }
  }

  return map
}

export function html (parts, ...args) {
  const randomPrefix = generateId(8)
  const placeholder = n => `<!--${randomPrefix} ${n}-->`
  const container = document.createElement('div')

  container.innerHTML = parts.slice(1).reduce(
    (inner, part, idx) => inner + placeholder(idx) + part,
    parts[0]
  )

  if (container.children.length > 1) {
    throw new Error('html must return only one root element')
  }

  let replaced = 0
  const commentType = NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION
  const elementType = NodeFilter.SHOW_ELEMENT
  const nodes = document.createNodeIterator(container, commentType | elementType)
  const placeholderPattern = new RegExp(`<!--${randomPrefix} (\\d)-->`)

  for (let node = nodes.nextNode(); node !== null; node = nodes.nextNode()) {
    if (node.nodeType & commentType) {
      const [prefix, idx] = node.nodeValue.split(' ')
      if (prefix !== randomPrefix) {
        continue
      }

      const arg = args[parseInt(idx, 10)]

      if (arg instanceof Element) {
        node.replaceWith(arg)
        replaced++
      } else if (arg instanceof Array || arg instanceof HTMLCollection) {
        const parent = node.parentElement
        for (const child of arg) {
          if (!(child instanceof Element)) {
            throw new Error(`Dynamic array placeholder contains non DOM Element: ${child}`)
          }
          parent.insertBefore(child, node)
        }
        parent.removeChild(node)
        replaced++
      } else {
        node.replaceWith(document.createTextNode(`${arg}`))
        replaced++
      }
    } else if ((node.nodeType & elementType) && node.attributes.length) {
      for (const attr of Array.from(node.attributes)) {
        const sanitized = attr.value.replace(
          placeholderPattern,
          (match, idx) => `${args[idx]}`
        )

        if (sanitized !== attr.value) {
          node.setAttribute(attr.name, sanitized)
          replaced++
        }
      }
    }
  }

  if (replaced !== args.length) {
    throw new Error('could not insert dynamic parts of the template string')
  }

  return container.firstElementChild
}

export function deriveKey (password) {
  const toBytes = m => aesjs.utils.utf8.toBytes(m)

  return aesjs.utils.hex.fromBytes(fastSha.pbkdf2(
    toBytes(password),
    toBytes(SALT),
    1, 32))
}

export function encrypt (key, message) {
  const messageBytes = aesjs.utils.utf8.toBytes(message)
  // eslint-disable-next-line new-cap
  const aesCtr = new aesjs.ModeOfOperation.ctr(key)
  const cipherBytes = aesCtr.encrypt(messageBytes)
  return aesjs.utils.hex.fromBytes(cipherBytes)
}

export function decrypt (key, cipher) {
  const cipherBytes = aesjs.utils.hex.toBytes(cipher)
  // eslint-disable-next-line new-cap
  const aesCtr = new aesjs.ModeOfOperation.ctr(key)
  const messageBytes = aesCtr.decrypt(cipherBytes)
  return aesjs.utils.utf8.fromBytes(messageBytes)
}

export function setupComponents (...components) {
  const style = document.createElement('style')
  for (const component of components) {
    if (component.prototype instanceof HTMLElement) {
      customElements.define(kebab(component.name), component)
    }

    if (typeof component.style === 'function') {
      style.appendChild(document.createTextNode(component.style()))
    } else if (typeof component.style === 'string') {
      style.appendChild(document.createTextNode(component.style))
    }
  }

  document.head.append(style)
}

function kebab (mixedCased) {
  return mixedCased.split(/([A-Z])/).reduce(
    (dashed, chunk, idx) => idx % 2 === 0 ? `${dashed}${chunk}` : `${dashed}-${chunk.toLowerCase()}`,
    ''
  ).replace(/^-|-$/, '')
}

export const fromBytes = aesjs.utils.hex.fromBytes
export const toBytes = aesjs.utils.hex.toBytes

export const _test = { parseRoutes, kebab }
