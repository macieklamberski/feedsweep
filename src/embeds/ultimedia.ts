import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'ultimedia'

const ultimediaHost = 'ultimedia.com'

// The account key and the video id each sit directly after their own route word.
const playerPathRegex = /\/mdtk\/([a-z\d]+)\/src\/([a-z\d]+)/i

// Ultimedia, trading as Digiteka: the generic player iframe, which plays as it stands and states
// its own size. The legacy `/swf/iframe_pub.php` route carries no account key and its player is
// gone, so there is nothing on it to mint from.
export const ultimediaEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="ultimedia.com/deliver"]',
  (element) => {
    const src = attr(element, 'src')
    const parsed = parseUrlOnHosts(src, ultimediaHost)
    const match = parsed && playerPathRegex.exec(parsed.pathname)

    if (!src || !match) {
      return
    }

    return {
      provider,
      // The player url takes the account key beside the video id, and enrichment is handed the
      // id alone.
      id: `${match[1]}/${match[2]}`,
      src,
    }
  },
)
