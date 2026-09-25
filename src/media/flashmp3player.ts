import type { MediaResolver } from '../types.js'
import { flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const flashMp3PlayerHosts = ['flash-mp3-player.net']

// The free Flash MP3 Player widget, in both its skins. Its own `.swf` answers 404, and the file
// it plays is the publisher's own, named in `mp3` and usually still serving.
export const flashMp3PlayerMediaResolver: MediaResolver = {
  kind: 'media',
  selector:
    'embed[src*="flash-mp3-player.net/medias/"], object[data*="flash-mp3-player.net/medias/"]',
  extract: (element) => {
    if (!parseUrlOnHosts(readCarrierUrl(element), flashMp3PlayerHosts)) {
      return
    }

    const source = flashVar(element, 'mp3')

    if (!source) {
      return
    }

    return {
      tag: 'audio',
      src: source,
    }
  },
}
