import { composeQuery, getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { hyphenatedLettersRegex, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

type Resource = {
  id: string
  path: string
}

const provider = 'komoot'

const hosts = ['komoot.com', 'komoot.de']

const sizes = {
  player: { height: 440 },
}

// `share_token` is what opens a tour its owner has not made public.
const accessParams = ['share_token']

const readResource = (segments: Array<string>): Resource | undefined => {
  const [route, id = '', ...rest] = segments

  if (!id) {
    return
  }

  if (isAnyOf(route, 'tour') && isAnyOf(rest[0], 'embed')) {
    return { id, path: `tour/${id}` }
  }

  const [slug = '', action] = rest

  if (isAnyOf(route, 'collection') && slug && isAnyOf(action, 'embed')) {
    return { id: `collection/${id}`, path: `collection/${id}/${slug}` }
  }
}

// Komoot's tour map, `komoot.com/tour/{tourId}/embed`, and its collection map,
// `komoot.com/collection/{collectionId}/{slug}/embed`, sometimes behind a locale segment.
export const komootResolveEmbed: ResolveUrlEmbed = (url) => {
  const [first = '', ...rest] = getPathSegments(url)
  // In any case: the mint drops the locale, so `/DE-DE/tour/{tourId}/embed`, which answers 404,
  // still names the tour.
  const hasLocale = hyphenatedLettersRegex.test(first)
  const resource = readResource(hasLocale ? rest : [first, ...rest])

  if (!resource) {
    return
  }

  const params = pickQueryParams(url.search, accessParams)
  const result: EmbedResolverResult = {
    provider,
    id: resource.id,
    src: `https://www.komoot.com/${resource.path}/embed${composeQuery(params)}`,
    ...sizes.player,
  }

  // A share token grants access to a tour, so it stays in the src and is not copied into a url.
  return params.share_token ? result : { ...result, url: `https://www.komoot.com/${resource.path}` }
}

export const komootEmbedResolver = createUrlEmbedResolver(hosts, komootResolveEmbed)
