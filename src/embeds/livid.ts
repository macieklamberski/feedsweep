import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'livid'
const playerRatio = '16/9'

const lividHosts = ['livid.com']

// `watch` is the video page and `embed` the player, both served in any case, and both take the
// video id next.
const videoRoutes = new Set(['watch', 'embed'])

const iframeSrcRegex = /<iframe\s[^>]*?\bsrc="([^"]+)"/i

export const lividResolveEmbed: ResolveEmbed = (url, element) => {
  const [route, videoId] = getPathSegments(url)

  if (!route || !videoRoutes.has(route.toLowerCase()) || !videoId) {
    return
  }

  // MetaSlider's Livid slide writes its own translated player label as the iframe `title`.
  const isMetasliderSlide = Boolean(element?.closest('li.ms-livid'))

  return {
    provider,
    id: videoId,
    src: `https://livid.com/embed/${videoId}`,
    url: `https://livid.com/watch/${videoId}`,
    ratio: playerRatio,
    title: isMetasliderSlide ? undefined : attr(element, 'title'),
  }
}

// A Livid player iframe, or a frame of a video page.
export const lividIframeEmbedResolver = createUrlEmbedResolver(lividHosts, lividResolveEmbed)

// MetaSlider's lazy Livid slide parks the player iframe as markup in `data-embed`, beside a poster
// image, and only the plugin's script swaps them.
export const lividMetasliderEmbedResolver = createMarkupEmbedResolver(
  'li.ms-livid div.ms-livid-lazy-wrap[data-embed]',
  (element) => {
    const src = attr(element, 'data-embed')?.match(iframeSrcRegex)?.[1]
    const url = parseUrlOnHosts(src, lividHosts)

    if (!url) {
      return
    }

    const result = lividResolveEmbed(url.href)

    if (!result) {
      return
    }

    return {
      ...result,
      thumbnail: attr(element.querySelector('img.msDefaultImage'), 'src'),
    }
  },
)
