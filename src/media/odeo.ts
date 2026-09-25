import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const odeoHosts = ['odeo.com']

// Odeo's own media host stopped resolving, so a file it names cannot be recovered.
const deadFileHosts = ['media.odeo.com']

// Odeo's 2006 Flash audio player, which names the episode's own file in `external_url`. The
// player is gone and the file it names is usually on the publisher's own host.
export const odeoMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'embed[src*="odeo.com/flash/"], object[data*="odeo.com/flash/"]',
  extract: (element) => {
    if (!parseUrlOnHosts(readCarrierUrl(element), odeoHosts)) {
      return
    }

    const source = flashVar(element, 'external_url')

    if (!source || parseUrlOnHosts(source, deadFileHosts)) {
      return
    }

    return {
      tag: 'audio',
      src: source,
    }
  },
}
