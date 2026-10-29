import type { DomTransform } from '../../types.js'
import { isInScope } from '../../utils/dom.js'
import { isUrlShaped } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

// Rebuilds an iframe from a url a widget parks on an attribute and loads with JS.
export const rebuildDeferredIframes: DomTransform = ({ deferredIframeSources }) => {
  return (document) => {
    for (const entry of deferredIframeSources) {
      for (const element of document.querySelectorAll(`[${entry.attribute}]`)) {
        if (!isInScope(element, entry)) {
          continue
        }

        const src = element.getAttribute(entry.attribute)

        if (!src || !isUrlShaped(src)) {
          continue
        }

        const iframe = createIframe(document, src)
        element.replaceWith(iframe)
      }
    }
  }
}
