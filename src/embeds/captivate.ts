import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { lettersRegex, uuidRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'captivate'

const captivateHosts = ['captivate.fm']

// The boxes Captivate's snippets write: 200 tall for an episode, and 600 for a show, which scrolls
// its episode list inside the frame. A kind added later gets the episode's.
const playerHeight = 200
const showHeight = 600

export const extractCaptivateEmbed = (link: string): { kind: string; id: string } | undefined => {
  const segments = getPathSegments(link)
  const [kind, id] = segments

  // The segment count keeps a `media/{uuid}/{file}.mp3` enclosure out of a dead placeholder. The kind
  // is a shape, so a kind added later still resolves.
  if (segments.length !== 2 || !kind || !id || !lettersRegex.test(kind) || !uuidRegex.test(id)) {
    return
  }

  return { kind, id }
}

// Captivate's player iframe, a kind and a uuid, with no oEmbed to size it.
export const captivateResolveEmbed: ResolveEmbed = (url) => {
  const embed = extractCaptivateEmbed(url)

  if (!embed) {
    return
  }

  // Captivate's snippet writes an episode player with a trailing slash and a show player without.
  const trailingSlash = embed.kind === 'episode' ? '/' : ''

  return {
    provider,
    id: `${embed.kind}/${embed.id}`,
    src: `https://player.captivate.fm/${embed.kind}/${embed.id}${trailingSlash}`,
    height: embed.kind === 'show' ? showHeight : playerHeight,
  }
}

export const captivateEmbedResolver = createUrlEmbedResolver(captivateHosts, captivateResolveEmbed)

// The player takes no query to start. Its own embed API posts this action into the frame, and
// the frame posts nothing first, so the request goes on load.
export const captivateRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: { action: 'CP.API.PLAY' },
}
