import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'acast'

const acastHosts = ['embed.acast.com', 'player.acast.com']

// Acast's share code writes `height="190px"` and its pages state `twitter:player:height` 190.
const sizes = {
  player: { height: 190 },
}

// The spellings all redirect to `embed.acast.com/{show}/{episode}`: the current embed code
// `embed.acast.com/$/{show}/{episode}`, the same path without the `$`, and the older
// `player.acast.com/{show}/episodes/{episode}`, with or without `episodes`. A show alone is the
// playlist player.
const extractAcastEmbed = (url: URL): { show: string; episode?: string } | undefined => {
  const allSegments = getPathSegments(url)
  const segments = allSegments[0] === '$' ? allSegments.slice(1) : allSegments
  const isPlayerHost = url.hostname === 'player.acast.com'
  const isEpisodesRoute = isPlayerHost && isAnyOf(segments[1], 'episodes')
  const [show, episode] = isEpisodesRoute ? [segments[0], segments[2]] : segments

  if (!show) {
    return
  }

  return { show, episode }
}

const acastResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const embed = extractAcastEmbed(url)

  if (!embed) {
    return
  }

  const path = embed.episode ? `${embed.show}/${embed.episode}` : embed.show

  return {
    provider,
    id: path,
    src: `https://embed.acast.com/${path}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

// Acast's player iframe, spelled three ways across the embed host and the retired player host.
export const acastEmbedResolver = createUrlEmbedResolver(acastHosts, acastResolveEmbed)

export const acastFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Embed Player' },
]

// The player takes no query to start; it speaks player.js.
export const acastRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
