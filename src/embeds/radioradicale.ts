import { getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'radioradicale'

const hosts = ['radioradicale.it']

const sizes = {
  player: { ratio: '16/9' },
}

// The player's own script reads these from its query: the first and last playlist item, the
// speech, and the start and end second. It also reads `a` and `m`, autoplay and branding.
const playbackParams = ['f', 'i', 'p', 's', 't']

const composeEmbed = (id: string, query = ''): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://www.radioradicale.it/scheda/${id}/iframe${query}`,
    url: `https://www.radioradicale.it/scheda/${id}`,
    ...sizes.player,
  }
}

// The Flowplayer configuration, `/scheda/embedcfg/{id}/{clip}`, that the Flash object names in its
// `config` query. The clip picks a stretch of the recording whose seconds only that config holds.
const readFlashId = (parsed: URL): string | undefined => {
  const config = parseUrlOnHosts(getQueryParam(parsed.searchParams, 'config'), hosts)

  if (!config) {
    return
  }

  const [scheda, embedcfg, id, , ...rest] = getPathSegments(config)

  if (!isAnyOf(scheda, 'scheda') || !isAnyOf(embedcfg, 'embedcfg') || rest.length > 0) {
    return
  }

  return id
}

// Radio Radicale's archive player, `/scheda/{id}/iframe`, which 301s to the same path with the
// recording's slug inserted. The page `/scheda/{id}` does the same. The server folds the case of
// the route words. The Flash player took the same id, so it is rebuilt onto the current one.
export const radioradicaleResolveEmbed: ResolveUrlEmbed = (url) => {
  const flashId = readFlashId(url)

  if (flashId) {
    return composeEmbed(flashId)
  }

  const [scheda, id, iframe, ...rest] = getPathSegments(url)

  if (!isAnyOf(scheda, 'scheda') || !isAnyOf(iframe, 'iframe') || rest.length > 0) {
    return
  }

  return composeEmbed(id, pickUrlParams(url, playbackParams))
}

export const radioradicaleEmbedResolver = createUrlEmbedResolver(hosts, radioradicaleResolveEmbed)
