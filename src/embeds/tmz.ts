import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tmz'

const tmzHosts = ['share.tmz.com']

// `/watch/` redirects onto the player route with the same slug.
const playerRoutes = ['videos', 'watch']

const sizes = {
  player: { ratio: '16/9' },
}

// TMZ's syndication player, `share.tmz.com/videos/{slug}/`. The server matches the slug in any
// case, so the key folds it.
export const tmzResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route = '', slug, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, playerRoutes) || !slug || rest.length > 0) {
    return
  }

  return {
    provider,
    id: slug.toLowerCase(),
    src: `https://share.tmz.com/videos/${slug}/`,
    url: `https://www.tmz.com/watch/${slug}/`,
    ...sizes.player,
  }
}

export const tmzEmbedResolver = createUrlEmbedResolver(tmzHosts, tmzResolveEmbed)
