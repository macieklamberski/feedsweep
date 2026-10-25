import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const tmzHosts = ['share.tmz.com']

// `/watch/` redirects onto the player route with the same slug.
const playerRoutes = ['videos', 'watch']

// TMZ's syndication player, `share.tmz.com/videos/{slug}/`. The server matches the slug in any
// case, so the key folds it.
export const tmzResolveEmbed: ResolveUrlEmbed = (_url, _element, parsed) => {
  const [route = '', slug, ...rest] = getPathSegments(parsed)

  if (!isAnyOf(route, playerRoutes) || !slug || rest.length > 0) {
    return
  }

  return {
    provider: 'tmz',
    id: slug.toLowerCase(),
    src: `https://share.tmz.com/videos/${slug}/`,
    url: `https://www.tmz.com/watch/${slug}/`,
    ratio: '16/9',
  }
}

export const tmzEmbedResolver = createUrlEmbedResolver(tmzHosts, tmzResolveEmbed)
