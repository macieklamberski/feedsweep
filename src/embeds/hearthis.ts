import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'hearthis'

const hearthisHosts = ['hearthis.at']

// The track bar is a fixed height at any width. The set player fills its frame, and the embed
// dialog writes it 350 tall.
const trackHeight = 150
const setHeight = 350

export const hearthisResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, hearthisHosts)
  const [route, id, third, ...rest] = parsed ? getPathSegments(parsed) : []

  // `embed/{id}/{theme}/`, where the theme segment only colours the player.
  if (isAnyOf(route, 'embed') && id) {
    return {
      provider,
      id: `track/${id}`,
      src: `https://app.hearthis.at/embed/${id}/`,
      height: trackHeight,
    }
  }

  // `set/{set}-{user}/embed/`. The player reads the set id alone, which the embed dialog writes.
  if (!isAnyOf(route, 'set') || !id || !isAnyOf(third, 'embed') || rest.length) {
    return
  }

  const [setId] = id.split('-')

  return {
    provider,
    id: `set/${setId}`,
    src: `https://app.hearthis.at/set/${setId}/embed/`,
    height: setHeight,
  }
}

// hearthis.at's track and set player iframes, on hearthis.at or app.hearthis.at.
export const hearthisEmbedResolver = createUrlEmbedResolver(hearthisHosts, hearthisResolveEmbed)

// A set page ignores `autoplay=1`, and its `play` message plays the track whose id equals the set id.
export const hearthisRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
