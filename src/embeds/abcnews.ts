import type { ResolveEmbed } from '../types.js'
import { composeQuery, encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'abcnews'

// `abcnews.go.com` is the host the embed snippet wrote for years, and it 301s onto `abcnews.com`
// with the path and query kept.
const abcnewsHosts = ['abcnews.com', 'abcnews.go.com']

// The server matches the route words in any case.
const playerPathRegex = /^\/video\/embed\/?$/i

// ABC News' video player, `/video/embed?id={id}`. The site's own script builds it on the site's
// host, which is `abcnews.com` today.
export const abcnewsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, abcnewsHosts)

  if (!parsed || !playerPathRegex.test(parsed.pathname)) {
    return
  }

  const id = parsed.searchParams.get('id')

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://abcnews.com/video/embed${composeQuery({ id })}`,
    url: `https://abcnews.com/video/${encodePathSegment(id)}`,
    ratio: '16/9',
  }
}

export const abcnewsEmbedResolver = createUrlEmbedResolver(abcnewsHosts, abcnewsResolveEmbed)
