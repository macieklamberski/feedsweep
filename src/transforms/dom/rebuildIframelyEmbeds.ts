import type { DomTransform, EmbedResolver, MediaResolver } from '../../types.js'
import { attr, hasText } from '../../utils/dom.js'
import { isUrlShaped } from '../../utils/urls.js'
import { isEmbedOrMediaResolver } from '../../utils/widgets.js'

const facadeSelector = 'a[data-iframely-url][href]'
const wrapperSelector = '.iframely-embed'

// The probe is a bare iframe onto the destination, so a resolver answers for the destination alone.
const isClaimed = async (
  probe: Element,
  resolvers: Array<EmbedResolver | MediaResolver>,
): Promise<boolean> => {
  for (const resolver of resolvers) {
    if (probe.matches(resolver.selector) && (await resolver.extract(probe))) {
      return true
    }
  }

  return false
}

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
      const probe = document.createElement('iframe')

      probe.setAttribute('src', href)

      if (await isClaimed(probe, resolvers)) {
        target.replaceWith(probe)
        continue
      }

      const link = document.createElement('a')

      link.setAttribute('href', href)
      link.textContent = href
      target.replaceWith(link)
    }
  }
}
