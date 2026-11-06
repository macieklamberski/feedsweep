import { includesAnyOf, parseUrl } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { audioFileRegex, placeholderBaseUrl } from '../utils/urls.js'
import { matchCarrierUrl, readCarrierUrlOnHosts } from '../utils/widgets.js'

const hosts = ['media.libsyn.com']
const playerPath = '/_static/play/player-licensed.swf'

// A licensed JW Player `.swf` uploaded to a show's Libsyn space, which renders nothing since Flash
// was blocked. Its `file` flashvar names the episode's own audio file.
export const libsynMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'embed[src]',
  extract: (element, context) => {
    const player = readCarrierUrlOnHosts(element, hosts, context)

    if (!includesAnyOf(player?.pathname, playerPath)) {
      return
    }

    const source = flashVar(element, 'file')

    if (!source) {
      return
    }

    const matched = matchCarrierUrl(element, source, context)
    const path = parseUrl(matched, placeholderBaseUrl)?.pathname ?? ''

    // JW Player also takes a YouTube watch page in `file`, which an audio element cannot play.
    if (!audioFileRegex.test(path)) {
      return
    }

    return {
      tag: 'audio',
      src: source,
    }
  },
}
