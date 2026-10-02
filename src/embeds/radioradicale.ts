import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'radioradicale'

const radioradicaleHosts = ['radioradicale.it']

// The player's own script reads these from its query: the first and last playlist item, the
// speech, and the start and end second. It also reads `a` and `m`, autoplay and branding.
const playbackParams = ['f', 'i', 'p', 's', 't']

const composeEmbed = (id: string, query = ''): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://www.radioradicale.it/scheda/${id}/iframe${query}`,
    url: `https://www.radioradicale.it/scheda/${id}`,
    ratio: '16/9',
  }
}

// The Flowplayer configuration, `/scheda/embedcfg/{id}/{clip}`, that the Flash object names in its
// `config` query. The clip picks a stretch of the recording the iframe player cannot address.
const readFlashId = (parsed: URL): string | undefined => {
  const config = parseUrlOnHosts(parsed.searchParams.get('config') ?? '', radioradicaleHosts)

  if (!config) {
    return
  }

  const [scheda, embedcfg, id, , ...rest] = getPathSegments(config)

  if (scheda !== 'scheda' || embedcfg !== 'embedcfg' || rest.length > 0) {
    return
  }

  return id
}

// Radio Radicale's archive player, `/scheda/{id}/iframe`, which 301s to the same path with the
// recording's slug inserted. The page `/scheda/{id}` does the same. The server matches the route
// words in their own case only: `/IFRAME` lands on the page, which refuses framing. The Flash
// player took the same id, so it is rebuilt onto the current one.
export const radioradicaleResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, radioradicaleHosts)

  if (!parsed) {
    return
  }

  const flashId = readFlashId(parsed)

  if (flashId) {
    return composeEmbed(flashId)
  }

  const [scheda, id, iframe, ...rest] = getPathSegments(parsed)

  if (scheda !== 'scheda' || iframe !== 'iframe' || rest.length > 0) {
    return
  }

  return composeEmbed(id, pickUrlParams(parsed.href, playbackParams))
}

export const radioradicaleEmbedResolver = createUrlEmbedResolver(
  radioradicaleHosts,
  radioradicaleResolveEmbed,
)
