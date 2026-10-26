import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pinecast'

const pinecastHosts = ['pinecast.com']

// The host also serves the episode audio, under `/listen/{uuid}.mp3`.
const playerPathRegex = /^\/player\/([^/]+)\/?$/i

// The player without a theme draws the minimal bar, which stays this tall at any width.
const sizes = {
  player: { height: 60 },
}

// A Pinecast episode player.
export const pinecastResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const pathname = url.pathname
  const id = pathname.match(playerPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://pinecast.com/player/${id}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const pinecastEmbedResolver = createUrlEmbedResolver(pinecastHosts, pinecastResolveEmbed)

// The player posts no ready message. A `seekTo` message starts the audio from that position.
export const pinecastRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: { type: 'seekTo', timecodeMs: 0 },
}
