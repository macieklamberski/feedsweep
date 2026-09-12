import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const safeVideoIdRegex = /^\d+$/

// The player fills its box, and the watch page sizes it 16:9.
const playerRatio = '16/9'

// Odnoklassniki's player, `ok.ru/videoembed/{id}`, with the watch page at `ok.ru/video/{id}`.
// The watch page's poster is signed, so none is minted, and no render hint is exported because
// the player takes no parameter a reader would set on click.
export const odnoklassnikiResolveEmbed: ResolveEmbed = (url) => {
  const [route, videoId, ...rest] = getPathSegments(url)

  if (route !== 'videoembed' || !videoId || !safeVideoIdRegex.test(videoId) || rest.length) {
    return
  }

  return {
    provider: 'odnoklassniki',
    id: videoId,
    src: `https://ok.ru/videoembed/${videoId}`,
    url: `https://ok.ru/video/${videoId}`,
    ratio: playerRatio,
  }
}

export const odnoklassnikiEmbedResolver = createUrlEmbedResolver(
  ['ok.ru'],
  odnoklassnikiResolveEmbed,
)
