import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'canalu'

// The apex has no DNS, and `vod.canal-u.tv` serves the video files.
const canaluHosts = ['www.canal-u.tv']

// Canal-U's video player, `/chaines/{channel}/embed/{id}` today and `/embed/{id}` before, which
// redirects to the channel the id belongs to. The id is the video's node id, so it is the key on
// both routes. The player reads `t` as the start position and nothing else from its query.
export const canaluResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, canaluHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const query = pickUrlParams(parsed.href, ['t'])

  if (segments.length === 4) {
    const [chaines, channel, embed, id] = segments

    if (!isAnyOf(chaines, 'chaines') || !isAnyOf(embed, 'embed')) {
      return
    }

    return {
      provider,
      id,
      src: `https://www.canal-u.tv/chaines/${channel}/embed/${id}${query}`,
      ratio: '16/9',
    }
  }

  if (segments.length === 2) {
    const [embed, id] = segments

    if (!isAnyOf(embed, 'embed')) {
      return
    }

    return {
      provider,
      id,
      src: `https://www.canal-u.tv/embed/${id}${query}`,
      ratio: '16/9',
    }
  }
}

export const canaluEmbedResolver = createUrlEmbedResolver(canaluHosts, canaluResolveEmbed)
