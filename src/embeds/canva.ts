import { isHostOf, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

// Exact: `document-export.canva.com` serves the files a design exports.
const canvaHosts = ['canva.com', 'www.canva.com']

// /design/{designId}/{shareToken}/{view|watch}, where older snippets leave the token out.
const designPathRegex = /^\/design\/([^/]+(?:\/[^/]+)?)\/(view|watch)\/?$/

// The legacy loader never frames the viewer narrower than this, and adds 48px to its height.
const sdkMinWidth = 250
const sdkBarHeight = 48

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
  // `meta` is a layout the publisher picked in Canva's snippet, so it stays in the src.
  const query = parsed.searchParams.has('meta') ? '?embed&meta' : '?embed'

  return {
    provider: 'canva',
    id,
    src: `https://www.canva.com/design/${id}/${route}${query}`,
    url: `https://www.canva.com/design/${id}/${route}`,
  }
}

export const canvaIframeEmbedResolver = createUrlEmbedResolver(canvaHosts, canvaResolveEmbed)

// The retired `sdk.canva.com/v1/embed.js` mount, which the loader frames at `/view?embed` and
// sizes `width × data-height-ratio + 48`. The viewer centres the design in that box and draws its
// controls over it. Tuned to the narrowest frame.
export const canvaWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.canva-embed[data-design-id]',
  (element) => {
    const id = attr(element, 'data-design-id')

    if (!id) {
      return
    }

    const heightRatio = Number(attr(element, 'data-height-ratio'))
    const height = Math.ceil(sdkMinWidth * heightRatio + sdkBarHeight)

    return {
      provider: 'canva',
      id,
      src: `https://www.canva.com/design/${id}/view?embed`,
      url: `https://www.canva.com/design/${id}/view`,
      ...(heightRatio > 0 ? { ratio: `${sdkMinWidth}/${height}` } : {}),
    }
  },
  { preferResolverSize: true },
)
