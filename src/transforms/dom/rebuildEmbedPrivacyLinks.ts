import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createIframe, isEmbedOrMediaResolver, isResolvedIframe } from '../../utils/widgets.js'

// See: https://github.com/epiphyt/embed-privacy/blob/main/inc/handler/class-feed.php.
// Embed Privacy writes a link into a feed in place of the embed it blocks, pointing at the url the
// author embedded under a label such as "Open embedded content from YouTube".
export const rebuildEmbedPrivacyLinks: DomTransform = (context) => {
  const resolvers = context.widgetResolvers.filter(isEmbedOrMediaResolver)

  return async (document) => {
    for (const wrapper of document.querySelectorAll('.embed-privacy-url')) {
      // The probe is a bare iframe onto the embedded url, so a resolver answers for it alone.
      const probe = createIframe(document, attr(wrapper.querySelector('a'), 'href') ?? '')

      if (await isResolvedIframe(probe, resolvers)) {
        wrapper.replaceWith(probe)
      }
    }
  }
}
