import { encodePathSegment, isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'canva'

// Exact: `document-export.canva.com` serves the files a design exports.
const canvaHosts = ['canva.com', 'www.canva.com']

// /design/{designId}/{shareToken}/{view|watch}, where older snippets leave the token out.
const designPathRegex = /^\/design\/([^/]+(?:\/[^/]+)?)\/(view|watch)\/?$/i

const sizes = {
  design: { ratio: '16/9' },
}

// Canva's design viewer, which frames a design at `view` and a video design at `watch`. Neither
// the id nor the token addresses the design alone, so the id carries both. No thumbnail: its
// route answers a challenge page to every client, a real browser included.
export const canvaResolveEmbed: ResolveUrlEmbed = (url) => {
  const match = url.pathname.match(designPathRegex)

  if (!match) {
    return
  }

  const [, id, route] = match

  return {
    provider,
    id,
    src: `https://www.canva.com/design/${id}/${route}?embed`,
    url: `https://www.canva.com/design/${id}/${route}`,
    ...sizes.design,
  }
}

export const canvaIframeEmbedResolver = createUrlEmbedResolver(canvaHosts, canvaResolveEmbed, {
  isOnHost: isHostOf,
})

// The retired `sdk.canva.com/v1/embed.js` mount, which the loader frames at `/view?embed`.
export const canvaWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.canva-embed[data-design-id]',
  (element) => {
    const id = attr(element, 'data-design-id')

    if (!id) {
      return
    }

    // The id comes out of its attribute decoded, and it goes into a path.
    const segment = encodePathSegment(id)

    return {
      provider,
      id,
      src: `https://www.canva.com/design/${segment}/view?embed`,
      url: `https://www.canva.com/design/${segment}/view`,
      ...sizes.design,
    }
  },
)
