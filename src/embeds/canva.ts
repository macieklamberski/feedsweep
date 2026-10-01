import { isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

// Exact: `document-export.canva.com` serves the files a design exports.
const canvaHosts = ['canva.com', 'www.canva.com']

// /design/{designId}/{shareToken}/{view|watch}, where older snippets leave the token out.
const designPathRegex = /^\/design\/([^/]+(?:\/[^/]+)?)\/(view|watch)\/?$/

const designRatio = '16/9'

// Canva's design viewer, which frames a design at `view` and a video design at `watch`. Neither
// the id nor the token addresses the design alone, so the id carries both. No thumbnail: its
// route answers a challenge page to every client, a real browser included.
export const canvaResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)

  if (!parsed || !isHostOf(parsed, canvaHosts)) {
    return
  }

  const match = parsed.pathname.match(designPathRegex)

  if (!match) {
    return
  }

  const [, id, route] = match

  return {
    provider: 'canva',
    id,
    src: `https://www.canva.com/design/${id}/${route}?embed`,
    url: `https://www.canva.com/design/${id}/${route}`,
    ratio: designRatio,
  }
}

export const canvaIframeEmbedResolver = createUrlEmbedResolver(canvaHosts, canvaResolveEmbed)

// The retired `sdk.canva.com/v1/embed.js` mount, which the loader frames at `/view?embed`.
export const canvaWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.canva-embed[data-design-id]',
  (element) => {
    const id = attr(element, 'data-design-id')

    if (!id) {
      return
    }

    return {
      provider: 'canva',
      id,
      src: `https://www.canva.com/design/${id}/view?embed`,
      url: `https://www.canva.com/design/${id}/view`,
      ratio: designRatio,
    }
  },
  { preferResolverSize: true },
)
