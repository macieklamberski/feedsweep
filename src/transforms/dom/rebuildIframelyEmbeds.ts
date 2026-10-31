import type { DomTransform } from '../../types.js'
import { attr, hasText } from '../../utils/dom.js'
import { isUrlShaped, parseUrlOnHosts } from '../../utils/urls.js'
import {
  createIframe,
  createLink,
  isEmbedOrMediaResolver,
  isResolvedIframe,
} from '../../utils/widgets.js'

const facadeSelector = 'a[data-iframely-url][href]'
const wrapperSelector = '.iframely-embed'
const iframelyFrameHosts = ['if-cdn.com']

// Iframely's anchor facade: an empty <a> holding the destination inside a responsive wrapper that
// only embed.js fills, so the pipeline deletes the anchor as empty and the destination with it.
// Unwrapping an Iframely frame's url to the url it proxies is the caller's cleanUrlFn's, through
// urlpurify's embedProxyUnwrappers.
export const rebuildIframelyEmbeds: DomTransform = (context) => {
  const resolvers = context.widgetResolvers.filter(isEmbedOrMediaResolver)

  // CKEditor's oEmbed wrapper names the source url around a short-id frame, whose own url holds
  // no target.
  const readSourceUrl = (frame: Element): string | undefined => {
    if (parseUrlOnHosts(attr(frame, 'src'), iframelyFrameHosts)) {
      return attr(frame.closest('[data-oembed-url]'), 'data-oembed-url')
    }
  }

  return async (document) => {
    for (const anchor of document.querySelectorAll(facadeSelector)) {
      const href = attr(anchor, 'href') ?? ''

      if (!isUrlShaped(href) || anchor.firstElementChild || hasText(anchor)) {
        continue
      }

      const target = anchor.closest(wrapperSelector) ?? anchor
      // The probe is a bare iframe onto the destination, so a resolver answers for it alone.
      const probe = createIframe(document, href)

      if (await isResolvedIframe(probe, resolvers, context)) {
        target.replaceWith(probe)
        continue
      }

      target.replaceWith(createLink(document, href))
    }

    // A resolver that claims the source url mints the platform's own player instead of the proxy.
    for (const frame of document.querySelectorAll('iframe')) {
      const url = readSourceUrl(frame)

      if (!url) {
        continue
      }

      const probe = createIframe(document, url)

      if (await isResolvedIframe(probe, resolvers, context)) {
        frame.replaceWith(probe)
      }
    }
  }
}
