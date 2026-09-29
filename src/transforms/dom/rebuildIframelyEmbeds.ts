import type { DomTransform } from '../../types.js'
import { attr, hasText } from '../../utils/dom.js'
import { isUrlShaped } from '../../utils/urls.js'
import {
  createIframe,
  createLink,
  isEmbedOrMediaResolver,
  isResolvedIframe,
} from '../../utils/widgets.js'

const facadeSelector = 'a[data-iframely-url][href]'
const wrapperSelector = '.iframely-embed'

// Iframely's anchor facade: an empty <a> holding the destination inside a responsive wrapper that
// only embed.js fills, so the pipeline deletes the anchor as empty and the destination with it.
export const rebuildIframelyEmbeds: DomTransform = (context) => {
  const resolvers = context.widgetResolvers.filter(isEmbedOrMediaResolver)

  return async (document) => {
    for (const anchor of document.querySelectorAll(facadeSelector)) {
      const href = attr(anchor, 'href') ?? ''

      if (!isUrlShaped(href) || anchor.firstElementChild || hasText(anchor)) {
        continue
      }

      const target = anchor.closest(wrapperSelector) ?? anchor
      // The probe is a bare iframe onto the destination, so a resolver answers for it alone.
      const probe = createIframe(document, href)

      if (await isResolvedIframe(probe, resolvers)) {
        target.replaceWith(probe)
        continue
      }

      target.replaceWith(createLink(document, href))
    }
  }
}
