import type { EmbedRenderHint } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'ultimedia'

// The account key and the video id each sit directly after their own route word.
const playerPathRegex = /\/mdtk\/([^/]+)\/src\/([^/]+)(?:\/|$)/

// Ultimedia, trading as Digiteka: the generic player iframe, which plays as it stands and states
// its own size. The legacy `/swf/iframe_pub.php` route carries no account key and its player is
// gone, so there is nothing on it to mint from.
export const ultimediaEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="ultimedia.com/deliver"]',
  (element) => {
    const parsed = parseUrlOnHosts(attr(element, 'src'), 'ultimedia.com')
    const match = parsed && playerPathRegex.exec(parsed.pathname)

    if (!match) {
      return
    }

    const [, accountKey, videoId] = match

    return {
      provider,
      // A video id under another account key answers "This video is no longer available", and the
      // route without a key finds no playable source, so the key is part of what names the video.
      id: `${accountKey}/${videoId}`,
      // A path without `zone` loads zone 1, the placement the platform's oEmbed answer writes.
      src: `https://www.ultimedia.com/deliver/generic/iframe/mdtk/${accountKey}/src/${videoId}/`,
    }
  },
)

export const ultimediaRenderHint: EmbedRenderHint = {
  provider,
  // `autoplay` alone starts the player muted, and `muteForced=0` lifts it.
  autoplayParams: { autoplay: '1', muteForced: '0' },
}
