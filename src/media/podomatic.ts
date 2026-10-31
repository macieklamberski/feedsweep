import { encodePathSegment, getPathSegments, isAnyOf, startsWithAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { cleanCarrierUrl, pluginCarrierSelector, readCarrierUrlOnHosts } from '../utils/widgets.js'

const hosts = ['podomatic.com']
const playerPath = '/swf/joeplayer'

// Podomatic's Flash "joeplayer", whose `jsonLocation` flashvar names the episode by its timestamp
// in `{sub}.podomatic.com/entry/embed_params/{timestamp}`. Flash no longer runs, so it renders
// nothing, and the same timestamp names the episode's file on `/enclosure/{timestamp}.mp3`.
export const podomaticFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: pluginCarrierSelector,
  extract: (element, context) => {
    const player = readCarrierUrlOnHosts(element, hosts, context)

    if (!player || !startsWithAnyOf(player.pathname, playerPath)) {
      return
    }

    const jsonLocation = cleanCarrierUrl(element, flashVar(element, 'jsonLocation'), context)
    const location = parseUrlOnHosts(jsonLocation, hosts)

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
