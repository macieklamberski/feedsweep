import { parseUrl } from 'trousse'
import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { audioFileRegex, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const libsynMediaHosts = ['media.libsyn.com']

// A licensed JW Player `.swf` uploaded to a show's Libsyn space, which renders nothing since Flash
// was blocked. Its `file` flashvar names the episode's own audio file.
export const libsynMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'embed[src*="/_static/play/player-licensed.swf"]',
  extract: (element) => {
    if (!parseUrlOnHosts(readCarrierUrl(element), libsynMediaHosts)) {
      return
    }

    const source = flashVar(element, 'file')

    if (!source) {
      return
    }

    const path = parseUrl(source, placeholderBaseUrl)?.pathname ?? ''

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
