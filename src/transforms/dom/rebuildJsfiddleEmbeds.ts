import { composeFiddleUrl } from '../../embeds/jsfiddle.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createIframe } from '../../utils/widgets.js'

const loaderSelector = 'script[src*="jsfiddle.net/"]'

// JSFiddle's loader script writes the fiddle's frame client side, so the pipeline drops it and
// the fiddle with it.
export const rebuildJsfiddleEmbeds: DomTransform = () => (document) => {
  for (const script of document.querySelectorAll(loaderSelector)) {
    const url = composeFiddleUrl(attr(script, 'src'))

    if (url) {
      script.replaceWith(createIframe(document, url))
    }
  }
}
