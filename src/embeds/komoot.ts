import { getPathSegments, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type Resource = {
  id: string
  path: string
}

const komootHosts = ['komoot.com', 'komoot.de']

// `komoot.de` answers with a 301 onto the German locale on `komoot.com`, while `en.komoot.de`
// answers with one onto the English tour.
const hostLocales = toMap({
  'komoot.de': 'de-de',
  'www.komoot.de': 'de-de',
})

// Lowercase only: `/DE-DE/tour/{tourId}/embed` answers 404.
const localeRegex = /^[a-z]{2}-[a-z]{2}$/

// `share_token` is what opens a tour its owner has not made public. The rest are the publisher's
// choices of language and layout.
const mapParams = ['share_token', 'profile', 'hl', 'layout', 'gallery']

const readResource = (segments: Array<string>): Resource | undefined => {
  const [route, id = '', ...rest] = segments

  if (!id) {
    return
  }

  if (route === 'tour' && rest[0] === 'embed') {
    return { id, path: `tour/${id}` }
  }

  const [slug = '', action] = rest

  if (route === 'collection' && slug && action === 'embed') {
    return { id: `collection/${id}`, path: `collection/${id}/${slug}` }
  }
}

// Komoot's tour map, `komoot.com/tour/{tourId}/embed`, and its collection map,
// `komoot.com/collection/{collectionId}/{slug}/embed`, sometimes behind a locale segment.
export const komootResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, komootHosts)

  if (!parsed) {
    return
  }

  const [first = '', ...rest] = getPathSegments(parsed)
  const hasLocale = localeRegex.test(first)
  const resource = readResource(hasLocale ? rest : [first, ...rest])

  if (!resource) {
    return
  }

  const locale = hasLocale ? first : hostLocales.get(parsed.hostname)
  const path = locale ? `${locale}/${resource.path}` : resource.path
  const params = pickQueryParams(parsed.search, mapParams)
  const result: EmbedResolverResult = {
    provider: 'komoot',
    id: resource.id,
    src: `https://www.komoot.com/${path}/embed${composeQuery(params)}`,
  }

  // A share token grants access to a tour, so it stays in the src and is not copied into a url.
  return params.share_token ? result : { ...result, url: `https://www.komoot.com/${path}` }
}

export const komootEmbedResolver = createUrlEmbedResolver(komootHosts, komootResolveEmbed)
