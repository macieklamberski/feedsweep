import { composeQuery, encodePathSegment, getQueryParam } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'abcnews'

const sizes = {
  player: { ratio: '16/9' },
}

// `abcnews.go.com` is the host the embed snippet wrote for years, and it 301s onto `abcnews.com`
// with the path and query kept.
const hosts = ['abcnews.com', 'abcnews.go.com']

// The server matches the route words in any case.
const playerPathRegex = /^\/video\/embed\/?$/i

// ABC News' video player, `/video/embed?id={id}`. The site's own script builds it on the site's
// host, which is `abcnews.com` today.
export const abcnewsResolveEmbed: ResolveUrlEmbed = (url) => {
  if (!playerPathRegex.test(url.pathname)) {
    return
  }

  const id = getQueryParam(url.searchParams, 'id')

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://abcnews.com/video/embed${composeQuery({ id })}`,
    url: `https://abcnews.com/video/${encodePathSegment(id)}`,
    ...sizes.player,
  }
}

export const abcnewsEmbedResolver = createUrlEmbedResolver(hosts, abcnewsResolveEmbed)
