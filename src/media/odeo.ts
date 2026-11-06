import { getPathSegments, isAnyOf } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { matchCarrierUrl, pluginCarrierSelector, readCarrierUrlOnHosts } from '../utils/widgets.js'

const hosts = ['odeo.com']

// Odeo's own media host stopped resolving, so a file it names cannot be recovered.
const deadFileHosts = ['media.odeo.com']

// Odeo's 2006 Flash audio player, which names the episode's own file in `external_url`. The
// player is gone and the file it names is usually on the publisher's own host.
export const odeoMediaResolver: MediaResolver = {
  kind: 'media',
  selector: pluginCarrierSelector,
  extract: (element, context) => {
    const player = readCarrierUrlOnHosts(element, hosts, context)

    if (!player) {
      return
    }

    const [route] = getPathSegments(player)

    if (!isAnyOf(route, 'flash')) {
      return
    }

    const source = flashVar(element, 'external_url')

    if (!source || parseUrlOnHosts(matchCarrierUrl(element, source, context), deadFileHosts)) {
      return
    }

    return {
      tag: 'audio',
      src: source,
    }
  },
}
