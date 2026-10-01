import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'canalu'

// The apex has no DNS, and `vod.canal-u.tv` serves the video files.
const canaluHosts = ['www.canal-u.tv']

// Canal-U's video player, `/chaines/{channel}/embed/{id}`. The id is the video's node id, which
// `/node/{id}` and `/embed/{id}` serve without the channel, so the key is the id alone. The
// player reads `t` as the start position and nothing else from its query.
export const canaluResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, canaluHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  if (segments.length !== 4) {
    return
  }

  const [chaines, channel, embed, id] = segments

  if (!isAnyOf(chaines, 'chaines') || !isAnyOf(embed, 'embed')) {
    return
  }

  const query = pickUrlParams(parsed.href, ['t'])

  return {
    provider,
    id,
    src: `https://www.canal-u.tv/chaines/${channel}/embed/${id}${query}`,
    ratio: '16/9',
  }
}

export const canaluEmbedResolver = createUrlEmbedResolver(canaluHosts, canaluResolveEmbed)
