import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const channelOneHosts = ['1tv.ru']

// Channel One Russia's player, `1tv.ru/embed/{id}:{type}`. The type picks the id space: the
// player looks `11` up as a news item and `12` as a video, and the same number names a different
// item in each, so the key keeps both halves. The player reads `t` as the start position.
export const channelOneResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, channelOneHosts)

  if (!parsed) {
    return
  }

  const [embed, id, ...rest] = getPathSegments(parsed)

  if (embed !== 'embed' || !id || rest.length > 0) {
    return
  }

  // Without a type the route redirects to `/embed`, which plays nothing.
  if (!id.includes(':')) {
    return
  }

  const query = pickUrlParams(parsed.href, ['t'])

  return {
    provider: '1tv',
    id,
    src: `https://www.1tv.ru/embed/${id}${query}`,
    ratio: '16/9',
  }
}

export const channelOneEmbedResolver = createUrlEmbedResolver(
  channelOneHosts,
  channelOneResolveEmbed,
)
