import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'radioradicale'

const radioradicaleHosts = ['radioradicale.it']

// The player's own script reads these from its query: the first and last playlist item, the
// speech, and the start and end second. It also reads `a` and `m`, autoplay and branding.
const playbackParams = ['f', 'i', 'p', 's', 't']

// Radio Radicale's archive player, `/scheda/{id}/iframe`, which 301s to the same path with the
// recording's slug inserted. The page `/scheda/{id}` does the same. The server matches the route
// words in their own case only: `/IFRAME` lands on the page, which refuses framing.
export const radioradicaleResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, radioradicaleHosts)

  if (!parsed) {
    return
  }

  const [scheda, id, iframe, ...rest] = getPathSegments(parsed)

  if (scheda !== 'scheda' || iframe !== 'iframe' || rest.length > 0) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.radioradicale.it/scheda/${id}/iframe${pickUrlParams(parsed.href, playbackParams)}`,
    url: `https://www.radioradicale.it/scheda/${id}`,
    ratio: '16/9',
  }
}

export const radioradicaleEmbedResolver = createUrlEmbedResolver(
  radioradicaleHosts,
  radioradicaleResolveEmbed,
)
