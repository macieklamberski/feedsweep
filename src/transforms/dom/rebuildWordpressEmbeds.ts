import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createIframe, isEmbedOrMediaResolver, isResolvedIframe } from '../../utils/widgets.js'

const wrapperSelector = '.wp-block-embed__wrapper'
const whitespaceRegex = /\s/

// A WordPress embed block whose oEmbed call never rendered: the wrapper holds only the source url,
// as text or as an anchor autolinked onto it.
export const rebuildWordpressEmbeds: DomTransform = (context) => {
  const resolvers = context.widgetResolvers.filter(isEmbedOrMediaResolver)

  return async (document) => {
    for (const wrapper of document.querySelectorAll(wrapperSelector)) {
      const url = wrapper.textContent?.trim() ?? ''

      // Prose beside the url is the publisher's, not the block's.
      if (whitespaceRegex.test(url)) {
        continue
      }

      const anchor = wrapper.querySelector('a')

      if (anchor && attr(anchor, 'href') !== url) {
        continue
      }

      // A blockquote around the url is another platform's carrier, such as Instagram's captioned
      // post, and its own resolver mints more than the url alone does.
      if (wrapper.querySelector('blockquote')) {
        continue
      }

      // Any element beside the url, an image or a native player, is content the frame would
      // replace.
      const elements = [...wrapper.querySelectorAll(':not(br)')]

      if (elements.some((element) => !anchor?.contains(element) && !element.contains(anchor))) {
        continue
      }

      // The probe is a bare iframe onto the url, so a resolver answers for it alone. An unclaimed
      // url stays as the text or link it is.
      const probe = createIframe(document, url)

      if (!(await isResolvedIframe(probe, resolvers))) {
        continue
      }

      wrapper.textContent = ''
      wrapper.appendChild(probe)
    }
  }
}
