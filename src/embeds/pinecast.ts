import { parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pinecast'

const pinecastHosts = ['pinecast.com']

// The host also serves the episode audio, under `/listen/{uuid}.mp3`.
const playerPathRegex = /^\/player\/([^/]+)\/?$/

// The player without a theme draws the minimal bar, which stays this tall at any width.
const playerHeight = 60

// A Pinecast episode player.
export const pinecastResolveEmbed: ResolveEmbed = (url, element) => {
  const pathname = parseUrl(url, placeholderBaseUrl)?.pathname ?? ''
  const id = pathname.match(playerPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://pinecast.com/player/${id}`,
    height: playerHeight,
    title: attr(element, 'title'),
  }
}

export const pinecastEmbedResolver = createUrlEmbedResolver(pinecastHosts, pinecastResolveEmbed)

// The player posts no ready message. A `seekTo` message starts the audio from that position.
export const pinecastRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: { type: 'seekTo', timecodeMs: 0 },
}
