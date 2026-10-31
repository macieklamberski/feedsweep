import { getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { paramValue } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { cleanCarrierUrl, pluginCarrierSelector, readCleanedCarrierUrl } from '../utils/widgets.js'

const hosts = ['podbean.com']
const playerRoute = 'podcast-audio-video-blog-player'

// Podbean's Flash mp3 player, an `<embed>` or `<object>` whose swf query names the file in
// `audioPath`. Flash no longer runs, so it renders nothing.
export const podbeanFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: [
    pluginCarrierSelector,
    // An Internet Explorer object names the swf in its `movie` param.
    'object[classid]',
  ].join(', '),
  extract: (element, context) => {
    let playerUrl: string | undefined = readCleanedCarrierUrl(element, context)

    if (!playerUrl) {
      playerUrl = cleanCarrierUrl(element, paramValue(element, 'movie'), context)
    }

    const player = parseUrlOnHosts(playerUrl, hosts)

    if (!player) {
      return
    }

    const [route] = getPathSegments(player)

    if (!isAnyOf(route, playerRoute)) {
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
