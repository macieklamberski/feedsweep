import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'traileraddict'

const traileraddictHosts = ['traileraddict.com']

// The Flash player's two routes, which now 301 to the trailer's watch page.
const flashRoutes = ['emb', 'emd']

// The server matches this path in its own case only.
const playerPath = '/iframe.php'

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://traileraddict.com/iframe.php${composeQuery({ id })}`,
    url: `https://traileraddict.com/watch/${encodePathSegment(id)}`,
    ratio: '16/9',
  }
}

// Trailer Addict's player, `/iframe.php?id={id}`, the `embedUrl` its watch pages name. The Flash
// player, `/emd/{id}` or `/emb/{id}`, took the same id, so it is rebuilt onto the current one.
export const traileraddictResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, traileraddictHosts)

  if (!parsed) {
    return
  }

  if (parsed.pathname === playerPath) {
    const id = parsed.searchParams.get('id')

    if (!id) {
      return
    }

    return composeEmbed(id)
  }

  const [route, id, ...rest] = getPathSegments(parsed)

  if (!isAnyOf(route, flashRoutes) || !id || rest.length > 0) {
    return
  }

  return composeEmbed(id)
}

export const traileraddictEmbedResolver = createUrlEmbedResolver(
  traileraddictHosts,
  traileraddictResolveEmbed,
)
