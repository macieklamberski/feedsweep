import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const imdbHosts = ['imdb.com']

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider: 'imdb',
    id,
    src: `https://www.imdb.com/video/embed/${id}/`,
    url: `https://www.imdb.com/video/${id}/`,
    ratio: '16/9',
  }
}

// IMDb's trailer player, `/video/embed/{vi}/` today, and the older `/videoembed/{vi}` and
// `/video/{source}/{vi}/imdb/embed`, which both redirect onto it. The server ignores the source
// word, written as `imdb`, `wab` or `user`.
export const imdbResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, imdbHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  if (segments.length === 2) {
    const [videoembed, id] = segments

    if (videoembed !== 'videoembed') {
      return
    }

    return composeEmbed(id)
  }

  if (segments.length === 3) {
    const [video, embed, id] = segments

    if (video !== 'video' || embed !== 'embed') {
      return
    }

    return composeEmbed(id)
  }

  if (segments.length === 5) {
    const [video, , id, imdb, embed] = segments

    if (video !== 'video' || imdb !== 'imdb' || embed !== 'embed') {
      return
    }

    return composeEmbed(id)
  }
}

export const imdbEmbedResolver = createUrlEmbedResolver(imdbHosts, imdbResolveEmbed)
