import {
  composeQuery,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  isHostOf,
} from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'traileraddict'

const sizes = {
  player: { ratio: '16/9' },
}

const hosts = ['traileraddict.com']

// The Flash player's two routes, which now 301 to the trailer's watch page.
const flashRoutes = ['emb', 'emd']

const playerPath = '/iframe.php'

// Only this host takes the id as its only segment. The apex serves pages there, such as `/search`.
const shortHosts = ['v.traileraddict.com']

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://traileraddict.com/iframe.php${composeQuery({ id })}`,
    url: `https://traileraddict.com/watch/${encodePathSegment(id)}`,
    ...sizes.player,
  }
}

// Trailer Addict's player, `/iframe.php?id={id}`, the `embedUrl` its watch pages name. The Flash
// player, `/emd/{id}` or `/emb/{id}`, and the short `v.traileraddict.com/{id}` took the same id,
// so both are rebuilt onto the current one.
export const traileraddictResolveEmbed: ResolveUrlEmbed = (url) => {
  if (isHostOf(url, shortHosts)) {
    const [id, ...rest] = getPathSegments(url)

    if (!id || rest.length > 0) {
      return
    }

    return composeEmbed(id)
  }

  if (isAnyOf(url.pathname, playerPath)) {
    const id = getQueryParam(url.searchParams, 'id')

    if (!id) {
      return
    }

    return composeEmbed(id)
  }

  const [route, id, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, flashRoutes) || !id || rest.length > 0) {
    return
  }

  return composeEmbed(id)
}

export const traileraddictEmbedResolver = createUrlEmbedResolver(hosts, traileraddictResolveEmbed)
