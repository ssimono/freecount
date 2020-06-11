function splitTextNode (textNode, regexp, callback) {
  const chunks = Array.of(...textNode.nodeValue.matchAll(regexp)).map(match => [
    match.index,
    match.index + match[0].length,
    parseInt(match[1], 10)
  ])
  let newNodes = 0

  for (const [start, end, argIndex] of chunks.reverse()) {
    if (textNode.length > end) {
      textNode.splitText(end)
      newNodes++
    }

    const toAddress = textNode.splitText(start)
    newNodes++
    callback(toAddress, argIndex)
  }

  return newNodes
}

function Raw (content) {
  this.content = content
}

function _html (singleChild, parts, args) {
  const randomPrefix = btoa(Math.random()).replace(/^\d+/, '').substring(0, 8)
  const placeholderPattern = RegExp(`${randomPrefix}:(\\d+)`)
  const placeholderPatternGlobal = RegExp(placeholderPattern, 'g')
  const container = document.createElement('div')
  const fragment = new DocumentFragment()
  let replaced = 0

  container.innerHTML = parts.slice(1).reduce(
    (inner, part, idx) => {
      if (args[idx] instanceof Raw) {
        replaced++
        return inner + args[idx].content + part
      }

      return inner + `${randomPrefix}:${idx}` + part
    },
    parts[0]
  )

  fragment.append(...container.childNodes)

  if (singleChild && fragment.children.length > 1) {
    throw new Error('html must return only one root element')
  }

  const nodes = document.createNodeIterator(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)

  for (let node = nodes.nextNode(); node !== null && replaced < args.length; node = nodes.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      const newNodes = splitTextNode(node, placeholderPatternGlobal, (textNode, argIndex) => {
        const arg = args[argIndex]
        const parent = node.parentNode

        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
          throw new Error(`Cannot insert dynamic data into ${parent.tagName} tag`)
        } else if (!(arg instanceof Object)) {
          textNode.nodeValue = `${arg}`
          replaced++
        } else if (arg instanceof Element) {
          textNode.replaceWith(arg)
          replaced++
        } else if (arg instanceof Array || arg instanceof HTMLCollection) {
          for (const child of arg) {
            parent.insertBefore(
              child instanceof Element ? child : document.createTextNode(`${child}`),
              textNode
            )
          }
          parent.removeChild(textNode)
          replaced++
        }
      })

      // Bump iterator cursor to avoid rewind because of splitText calls
      for (let i = 0; i < newNodes; ++i) node = nodes.nextNode()
    } else if (node.nodeType === Node.ELEMENT_NODE && node.attributes.length) {
      for (const attr of node.attributes) {
        const name = attr.name
        const match = attr.value.match(placeholderPattern)

        if (!match) continue

        if (['href', 'src', 'target'].indexOf(name) >= 0 && match.input.match(/^\s*javascript/)) {
          throw new Error('forbidden dynamic interpolation in \'javascript:\' urls')
        } else if (name === 'style') {
          throw new Error('setting dynamic style property is not supported for now')
        } else if (name.match(/^on\w+/i)) {
          const full = match[0] === match.input.trim()

          if (!full || typeof args[match[1]] !== 'function') {
            throw new Error('forbidden dynamic interpolation in listener attribute')
          }

          node.addEventListener(name.toLowerCase().replace('on', ''), args[match[1]])
          replaced++
        } else {
          const rendered = attr.value.replace(placeholderPattern, (match, idx) => {
            replaced++
            return `${args[idx]}`
          })
          node.setAttribute(name, rendered)
        }
      }
    }
  }

  if (replaced !== args.length) {
    throw new Error('could not insert dynamic parts of the template string')
  }

  return singleChild ? fragment.firstElementChild : fragment
}

export default function html (parts, ...args) {
  return _html(true, parts, args)
}

export function fragment (parts, ...args) {
  return _html(false, parts, args)
}

export function raw (content) {
  return new Raw(content)
}
