import { getPathSegments } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const podomaticHost = 'podomatic.com'
const playerPath = '/swf/joeplayer'

// Podomatic's Flash "joeplayer", whose `jsonLocation` flashvar names the episode by its timestamp
// in `{sub}.podomatic.com/entry/embed_params/{timestamp}`. Flash no longer runs, so it renders
// nothing, and the same timestamp names the episode's file on `/enclosure/{timestamp}.mp3`.
export const podomaticFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: [
    `embed[src*="${podomaticHost}${playerPath}" i]`,
    `object[data*="${podomaticHost}${playerPath}" i]`,
  ].join(', '),
  extract: (element) => {
    const player = parseUrlOnHosts(readCarrierUrl(element), podomaticHost)

    if (!player?.pathname.startsWith(playerPath)) {
      return
    }

    const location = parseUrlOnHosts(flashVar(element, 'jsonLocation'), podomaticHost)

    if (!location) {
      return
    }

    const [entry, route, timestamp] = getPathSegments(location)

    if (entry !== 'entry' || route !== 'embed_params' || !timestamp) {
      return
    }

    return {
      tag: 'audio',
      src: `https://${location.hostname}/enclosure/${encodePathSegment(timestamp)}.mp3`,
    }
  },
}
