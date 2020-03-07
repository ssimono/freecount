import {dispatch, html} from '../lib.js'

/**
 * Binds temporary listener on touch events to re-trigger
 * higher-level pull events
 */
export function checkPull({target, targetTouches, timeStamp}) {
  if (!targetTouches.length) {
    return
  }

  const startTouch = targetTouches[0]

  target.addEventListener('touchend', (event) => {
    if (event.changedTouches.length) {
      const endTouch = event.changedTouches[0]
      const duration = event.timeStamp - timeStamp

      if (duration > 2000 || duration < 100) {
        return
      }

      const [diffX, diffY] = [
        endTouch.clientX - startTouch.clientX,
        endTouch.clientY - startTouch.clientY
      ]

      if (Math.abs(diffX) < 80 && diffY > 100) {
        dispatch(event.target, 'app:pulldown')
      }
    }
  }, {once: true})

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
