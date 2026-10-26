import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'imdb'

const hosts = ['imdb.com']

const sizes = {
  player: { ratio: '16/9' },
}

const composeEmbed = (id: string): EmbedResolverResult => {
  return {
    provider,
    id,
    src: `https://www.imdb.com/video/embed/${id}/`,
    url: `https://www.imdb.com/video/${id}/`,
    ...sizes.player,
  }
}

// IMDb's trailer player, `/video/embed/{vi}/` today, and the older `/videoembed/{vi}` and
// `/video/{source}/{vi}/imdb/embed`, which both redirect onto it. The server ignores the source
// word, written as `imdb`, `wab` or `user`.
export const imdbResolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)

  if (segments.length === 2) {
    const [videoembed, id] = segments

    if (!isAnyOf(videoembed, 'videoembed')) {
      return
    }

    return composeEmbed(id)
  }

  if (segments.length === 3) {
    const [video, embed, id] = segments

    if (!isAnyOf(video, 'video') || !isAnyOf(embed, 'embed')) {
      return
    }

    return composeEmbed(id)
  }

  if (segments.length === 5) {
    const [video, , id, imdb, embed] = segments

    if (!isAnyOf(video, 'video') || !isAnyOf(imdb, 'imdb') || !isAnyOf(embed, 'embed')) {
      return
    }

    return composeEmbed(id)
  }
}

export const imdbEmbedResolver = createUrlEmbedResolver(hosts, imdbResolveEmbed)
