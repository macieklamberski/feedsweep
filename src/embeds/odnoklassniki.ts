import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'odnoklassniki'

// The player fills its box, and the watch page sizes it 16:9.
const playerRatio = '16/9'

export const odnoklassnikiResolveEmbed: ResolveEmbed = (url) => {
  const [route, videoId, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'videoembed') || !videoId || rest.length) {
    return
  }

  return {
    provider,
    id: videoId,
    src: `https://ok.ru/videoembed/${videoId}`,
    url: `https://ok.ru/video/${videoId}`,
    ratio: playerRatio,
  }
}

// Odnoklassniki's player, `ok.ru/videoembed/{id}`, with the watch page at `ok.ru/video/{id}`.
export const odnoklassnikiEmbedResolver = createUrlEmbedResolver(
  ['ok.ru'],
  odnoklassnikiResolveEmbed,
)

export const odnoklassnikiRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
