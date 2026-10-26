import { composeQuery } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bunnystream'

const bunnystreamHosts = [
  'iframe.mediadelivery.net', // The older player, still served
  'player.mediadelivery.net',
]

// `/play` is the full-window page around the same player, addressed by the same pair.
const playerPathRegex = /^\/(?:embed|play)\/([^/]+)\/([^/]+)$/i

// The start position, and the token pair a library with embed authentication needs.
const playbackParams = ['t', 'token', 'expires']

const sizes = {
  player: { ratio: '16/9' },
}

export const bunnystreamResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const match = url.pathname.match(playerPathRegex)

  if (!match) {
    return
  }

  const [, libraryId, videoId] = match
  const picked = pickQueryParams(url.search, playbackParams)
  // The player autoplays unless the library turns it off, so a frame loaded without a click
  // would play unasked.
  const query = composeQuery({ autoplay: 'false', ...picked })

  return {
    provider,
    id: `${libraryId}/${videoId}`,
    src: `https://player.mediadelivery.net/embed/${libraryId}/${videoId}${query}`,
    url: picked.token ? undefined : `https://player.mediadelivery.net/play/${libraryId}/${videoId}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

// Bunny Stream's player iframe or its full-window `/play` page, which renders on its own but
// autoplays unless the library turns it off.
export const bunnystreamEmbedResolver = createUrlEmbedResolver(
  bunnystreamHosts,
  bunnystreamResolveEmbed,
)

export const bunnystreamRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
