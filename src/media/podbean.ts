import { getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { paramValue } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const podbeanHosts = ['podbean.com']
const playerRoute = 'podcast-audio-video-blog-player'

// Podbean's Flash mp3 player, an `<embed>` or `<object>` whose swf query names the file in
// `audioPath`. Flash no longer runs, so it renders nothing.
export const podbeanFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: [
    `embed[src*="podbean.com/${playerRoute}/" i]`,
    `object[data*="podbean.com/${playerRoute}/" i]`,
    // An Internet Explorer object names the swf in its `movie` param.
    'object[classid]',
  ].join(', '),
  extract: (element) => {
    let playerUrl: string | undefined = readCarrierUrl(element)

    if (!playerUrl) {
      playerUrl = paramValue(element, 'movie')
    }

    const player = parseUrlOnHosts(playerUrl, podbeanHosts)

    if (!player || !isAnyOf(getPathSegments(player)[0], playerRoute)) {
      return
    }

    const src = getQueryParam(player.searchParams, 'audioPath')

    if (!src) {
      return
    }

    return {
      tag: 'audio',
      src,
    }
  },
}
