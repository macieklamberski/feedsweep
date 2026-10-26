import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'hearthis'

const hosts = ['hearthis.at']

const sizes = {
  // The track bar is a fixed height at any width.
  track: { height: 150 },
  // The set player fills its frame, and the embed dialog writes it 350 tall.
  set: { height: 350 },
}

export const hearthisResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, id, third, ...rest] = getPathSegments(url)

  // `embed/{id}/{theme}/`, where the theme segment only colours the player.
  if (isAnyOf(route, 'embed') && id) {
    return {
      provider,
      id: `track/${id}`,
      src: `https://app.hearthis.at/embed/${id}/`,
      ...sizes.track,
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
    ...sizes.set,
  }
}

// hearthis.at's track and set player iframes, on hearthis.at or app.hearthis.at.
export const hearthisEmbedResolver = createUrlEmbedResolver(hosts, hearthisResolveEmbed)

// A set page ignores `autoplay=1`, and its `play` message plays the track whose id equals the set id.
export const hearthisRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
