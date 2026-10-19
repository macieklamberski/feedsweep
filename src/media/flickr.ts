import type { MediaResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'

const flickrHost = 'flickr.com'

// Flickr's `iphone_wifi` route answers 404, while `360p` redirects the same item to a signed
// mp4. The other qualities still play as written.
const retiredRouteRegex =
  /^(?<route>\/photos\/[^/]+\/[^/]+\/play\/)iphone_wifi(?<secret>\/[^/]+\/)$/

// A WordPress `<video src>` on a Flickr photo's play route, which no longer serves the item on
// its retired `iphone_wifi` quality.
export const flickrMediaResolver: MediaResolver = {
  kind: 'media',
  selector: 'video[src*="/play/iphone_wifi/"]',
  extract: (element) => {
    const url = parseUrlOnHosts(attr(element, 'src'), flickrHost)

    if (!url || !retiredRouteRegex.test(url.pathname)) {
      return
    }

    url.pathname = url.pathname.replace(retiredRouteRegex, '$<route>360p$<secret>')

    return {
      tag: 'video',
      src: url.href,
    }
  },
}
