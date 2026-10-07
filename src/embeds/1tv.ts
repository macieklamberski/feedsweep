import { getPathSegments, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const channelOneHosts = ['1tv.ru']

// The Flash routes the server redirects to `embed/{id}:{type}`, each against the type it names.
const legacyRouteTypes = toMap({
  i_newsvideo: '17',
  i_video: '15',
  newsvideo: '1',
  promoovideo: '15',
})

// Channel One Russia's player, `1tv.ru/embed/{id}:{type}`, and the Flash routes before it, such
// as `1tv.ru/newsvideo/{id}`. The type picks the id space: the player looks `1` and `17` up as a
// legacy news id, `15` as a legacy video, `11` as a news item and `12` as a video, and the same
// number names a different item in each, so the key keeps both halves. The player reads `t` as
// the start position.
export const channelOneResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, channelOneHosts)

  if (!parsed) {
    return
  }

  const [route, id, ...rest] = getPathSegments(parsed)
  const legacyType = legacyRouteTypes.get(route)

  if ((route !== 'embed' && !legacyType) || !id || rest.length > 0) {
    return
  }

  const key = legacyType ? `${id}:${legacyType}` : id

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
