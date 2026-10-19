import { parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bunnystream'

const bunnystreamHosts = [
  'iframe.mediadelivery.net', // The older player, still served
  'player.mediadelivery.net',
]

// `/play` is the full-window page around the same player, addressed by the same pair.
const playerPathRegex = /^\/(?:embed|play)\/([^/]+)\/([^/]+)$/

// The start position, and the token pair a library with embed authentication needs.
const playbackParams = ['t', 'token', 'expires']

export const bunnystreamResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const match = parsed?.pathname.match(playerPathRegex)

  if (!parsed || !match) {
    return
  }

  const [, libraryId, videoId] = match
  const picked = pickQueryParams(parsed.search, playbackParams)
  // The player autoplays unless the library turns it off, so a frame loaded without a click
  // would play unasked.
  const query = composeQuery({ autoplay: 'false', ...picked })

  return {
    provider,
    id: `${libraryId}/${videoId}`,
    src: `https://player.mediadelivery.net/embed/${libraryId}/${videoId}${query}`,
    url: picked.token ? undefined : `https://player.mediadelivery.net/play/${libraryId}/${videoId}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

export const bunnystreamEmbedResolver = createUrlEmbedResolver(
  bunnystreamHosts,
  bunnystreamResolveEmbed,
)

export const bunnystreamRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
