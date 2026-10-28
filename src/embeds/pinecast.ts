import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pinecast'

const hosts = ['pinecast.com']

// The host also serves the episode audio, under `/listen/{uuid}.mp3`.
const playerPathRegex = /^\/player\/([^/]+)\/?$/i
const playlistPathRegex = /^\/embed\/player_playlist\/([^/]+)\/?$/i

const sizes = {
  // The player without a theme draws the minimal bar, which stays this tall at any width.
  player: { height: 60 },
  // What Pinecast's playlist snippet writes beside `width:100%`. The player fills any box.
  playlist: { height: 270 },
}

// A Pinecast episode player, or the playlist player of a whole podcast.
export const pinecastResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const title = attr(element, 'title')
  const id = url.pathname.match(playerPathRegex)?.[1]

  if (id) {
    return {
      provider,
      id,
      src: `https://pinecast.com/player/${id}`,
      ...sizes.player,
      title,
    }
  }

  const slug = url.pathname.match(playlistPathRegex)?.[1]

  if (slug) {
    return {
      provider,
      // Qualified because a podcast slug and an episode id would otherwise share one key space.
      id: `playlist/${slug}`,
      src: `https://pinecast.com/embed/player_playlist/${slug}`,
      url: `https://pnc.st/s/${slug}`,
      ...sizes.playlist,
      title,
    }
  }
}

export const pinecastEmbedResolver = createUrlEmbedResolver(hosts, pinecastResolveEmbed)

// The player posts no ready message. A `seekTo` message starts the audio from that position.
export const pinecastRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: { type: 'seekTo', timecodeMs: 0 },
}
