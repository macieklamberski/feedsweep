import { composeLoaderViewerUrl } from '../../embeds/documentcloud.js'
import type { DomTransform } from '../../types.js'
import { createIframe } from '../../utils/widgets.js'

const loadCallRegex = /DV\.load\((['"])(.+?)\1/g

// DocumentCloud's old viewer snippet: an inline `DV.load` call naming the document, which only
// the loader script turns into a frame, so the feed shows nothing where the document was.
export const rebuildDocumentcloudEmbeds: DomTransform = () => (document) => {
  for (const script of document.querySelectorAll('script')) {
    const frames: Array<Element> = []

    for (const match of (script.textContent ?? '').matchAll(loadCallRegex)) {
      const url = composeLoaderViewerUrl(match[2])

      if (url) {
        frames.push(createIframe(document, url))
      }
    }

    if (frames.length === 0) {
      continue
    }

    script.replaceWith(...frames)
  }
}
