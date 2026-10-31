import type { DomTransform } from '../../types.js'
import { cleanUrl, repairUrl, resolveOrKeepUrl } from '../../utils/urls.js'
import {
  embedCarrierSelector,
  readRepairedCarrierUrl,
  setCleanedCarrierUrl,
} from '../../utils/widgets.js'

// Frame urls as the publisher pasted them, an embed proxy such as Embedly's or Iframely's around
// the player included, so the resolvers read the url the caller's cleanUrlFn unwraps.
export const cleanFrameUrls: DomTransform = (context) => {
  return (document) => {
    if (!context.cleanUrlFn) {
      return
    }

    for (const element of document.querySelectorAll(embedCarrierSelector)) {
      const attribute = element.localName === 'object' ? 'data' : 'src'
      const original = element.getAttribute(attribute)

      if (!original) {
        continue
      }

      // A cleaner reads the host, which a protocol-relative or site-relative src names only once
      // resolved.
      const url = resolveOrKeepUrl(readRepairedCarrierUrl(element), context)
      const cleaned = cleanUrl(url, context)

      // The repairs run on every read, and are never written into the document on their own. A
      // repair can apply once the url is resolved, such as a run of slashes after the base path.
      if (cleaned === repairUrl(url)) {
        continue
      }

      setCleanedCarrierUrl(element, { attribute, original, cleaned })
    }
  }
}
