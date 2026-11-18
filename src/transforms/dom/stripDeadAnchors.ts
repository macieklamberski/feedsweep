import type { DomTransform } from '../../types.js'
import { isDeadHref } from '../../utils/urls.js'

// An anchor whose href goes nowhere, which still looks clickable.
export const stripDeadAnchors: DomTransform = () => {
  return (document) => {
    const anchors = document.querySelectorAll('a')

    for (const anchor of anchors) {
      const href = anchor.getAttribute('href')

      // An anchor with no href is a named target other links scroll to.
      if (href === null || !isDeadHref(href)) {
        continue
      }

      // Unwrapping an anchor with an id or name breaks the #fragment and aria-* links to it.
      if (anchor.hasAttribute('id') || anchor.hasAttribute('name')) {
        continue
      }

      const parent = anchor.parentNode

      if (!parent) {
        continue
      }

      while (anchor.firstChild) {
        parent.insertBefore(anchor.firstChild, anchor)
      }

      anchor.remove()
    }
  }
}
