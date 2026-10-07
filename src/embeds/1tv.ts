import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const channelOneHosts = ['1tv.ru']

// Channel One Russia's player, `1tv.ru/embed/{id}:{type}`, and the Flash news player,
// `1tv.ru/newsvideo/{id}`. The type picks the id space: the player looks `1` up as a legacy news
// id, `11` as a news item and `12` as a video, and the same number names a different item in each,
// so the key keeps both halves. The player reads `t` as the start position.
export const channelOneResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, channelOneHosts)

  if (!parsed) {
    return
  }

  const [route, id, ...rest] = getPathSegments(parsed)

  if ((route !== 'embed' && route !== 'newsvideo') || !id || rest.length > 0) {
    return
  }

  // The server redirects `newsvideo/{id}` to `embed/{id}:1`.
  const key = route === 'newsvideo' ? `${id}:1` : id

  // Without a type the route redirects to `/embed`, which plays nothing.
  if (!key.includes(':')) {
    return
  }

  const query = pickUrlParams(parsed.href, ['t'])

  return {
    provider: '1tv',
    id: key,
    src: `https://www.1tv.ru/embed/${key}${query}`,
    ratio: '16/9',
  }
}

export const channelOneEmbedResolver = createUrlEmbedResolver(
  channelOneHosts,
  channelOneResolveEmbed,
)
