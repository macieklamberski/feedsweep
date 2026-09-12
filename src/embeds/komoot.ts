import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const komootHosts = ['komoot.com', 'komoot.de']

const safeTourIdRegex = /^\d+$/

// `share_token` is what opens a tour its owner has not made public, and `profile` draws the
// elevation graph under the map.
const tourParams = ['share_token', 'profile']

// Komoot's tour map, `komoot.com/tour/{tourId}/embed`, sometimes behind a locale segment.
export const komootResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, komootHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const marker = segments.indexOf('tour')
  const tourId = marker >= 0 ? segments[marker + 1] : undefined

  if (!parsed || !tourId || !safeTourIdRegex.test(tourId) || segments[marker + 2] !== 'embed') {
    return
  }

  const params = pickQueryParams(parsed.search, tourParams)
  const result: EmbedResolverResult = {
    provider: 'komoot',
    id: tourId,
    src: `https://www.komoot.com/tour/${tourId}/embed${composeQuery(params)}`,
  }

  // A tour behind a share token is not public, so its page is not a url a reader can open.
  return params.share_token ? result : { ...result, url: `https://www.komoot.com/tour/${tourId}` }
}

export const komootEmbedResolver = createUrlEmbedResolver(komootHosts, komootResolveEmbed)
