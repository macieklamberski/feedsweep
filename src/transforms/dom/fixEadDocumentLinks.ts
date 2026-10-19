import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'

// Embed Any Document's browser viewer writes its "Open in new tab" link as `#`, and the file
// it opens sits only in the document wrapper's `data-pdf-src`.
export const fixEadDocumentLinks: DomTransform = () => {
  return (document) => {
    for (const carrier of document.querySelectorAll('.ead-document')) {
      const src = attr(carrier, 'data-pdf-src')

      if (!src) {
        continue
      }

      for (const link of carrier.querySelectorAll('a[href="#"]')) {
        link.setAttribute('href', src)
      }
    }
  }
}
