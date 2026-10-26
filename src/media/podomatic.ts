import { encodePathSegment, getPathSegments, isAnyOf, startsWithAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const hosts = ['podomatic.com']
const playerPath = '/swf/joeplayer'

// Podomatic's Flash "joeplayer", whose `jsonLocation` flashvar names the episode by its timestamp
// in `{sub}.podomatic.com/entry/embed_params/{timestamp}`. Flash no longer runs, so it renders
// nothing, and the same timestamp names the episode's file on `/enclosure/{timestamp}.mp3`.
export const podomaticFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: hosts
    .flatMap((host) => {
      return [`embed[src*="${host}${playerPath}" i]`, `object[data*="${host}${playerPath}" i]`]
    })
    .join(', '),
  extract: (element) => {
    const player = parseUrlOnHosts(readCarrierUrl(element), hosts)

    if (!player || !startsWithAnyOf(player.pathname, [playerPath])) {
      return
    }

    const location = parseUrlOnHosts(flashVar(element, 'jsonLocation'), hosts)

    if (!location) {
      return
    }

    const [entry, route, timestamp] = getPathSegments(location)

    if (!isAnyOf(entry, 'entry') || !isAnyOf(route, 'embed_params') || !timestamp) {
      return
    }

    return {
      tag: 'audio',
      src: `https://${location.hostname}/enclosure/${encodePathSegment(timestamp)}.mp3`,
    }
  },
}
