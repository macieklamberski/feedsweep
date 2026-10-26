import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'canalu'

// The apex has no DNS, and `vod.canal-u.tv` serves the video files.
const canaluHosts = ['www.canal-u.tv']

const sizes = { player: { ratio: '16/9' } }

// Canal-U's video player, `/chaines/{channel}/embed/{id}` today and `/embed/{id}` before, which
// redirects to the channel the id belongs to. The id is the video's node id, so it is the key on
// both routes. The player reads `t` as the start position and nothing else from its query.
export const canaluResolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)
  const query = pickUrlParams(url, ['t'])

  if (segments.length === 4) {
    const [chaines, channel, embed, id] = segments

    if (!isAnyOf(chaines, 'chaines') || !isAnyOf(embed, 'embed')) {
      return
    }

    return {
      provider,
      id,
      src: `https://www.canal-u.tv/chaines/${channel}/embed/${id}${query}`,
      ...sizes.player,
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
      ...sizes.player,
    }
  }
}

export const canaluEmbedResolver = createUrlEmbedResolver(canaluHosts, canaluResolveEmbed)
