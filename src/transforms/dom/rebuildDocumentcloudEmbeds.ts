import { composeLoaderViewerUrl } from '../../embeds/documentcloud.js'
import type { DomTransform } from '../../types.js'
import { createIframe } from '../../utils/widgets.js'

const loadCallRegex = /DV\.load\(\s*(['"])(.+?)\1/

// DocumentCloud's old viewer snippet: an inline `DV.load` call naming the document, which only
// the loader script turns into a frame, so the feed shows nothing where the document was.
export const rebuildDocumentcloudEmbeds: DomTransform = () => (document) => {
  for (const script of document.querySelectorAll('script')) {
    const url = composeLoaderViewerUrl(script.textContent?.match(loadCallRegex)?.[2])

    if (!url) {
      continue
    }

    script.replaceWith(createIframe(document, url))
  }
}
