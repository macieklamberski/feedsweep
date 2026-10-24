import { getPathSegments } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { uuidRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'captivate'

const captivateHosts = ['captivate.fm']

// The boxes Captivate's snippets write: 200 tall for an episode, and 600 for a show, which scrolls
// its episode list inside the frame. A kind added later gets the episode's.
const playerHeight = 200
const showHeight = 600

// A shape, not a list of the two kinds published today, so a kind added later still resolves.
// The player host answers the same empty shell for every path it does not serve.
const embedKindRegex = /^[a-z]+$/

export const extractCaptivateEmbed = (link: string): { kind: string; id: string } | undefined => {
  const segments = getPathSegments(link)
  const [kind, id] = segments

  // The segment count keeps a `media/{uuid}/{file}.mp3` enclosure out of a dead placeholder.
  if (segments.length !== 2 || !kind || !id || !embedKindRegex.test(kind) || !uuidRegex.test(id)) {
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

  return {
    provider,
    id: `${embed.kind}/${embed.id}`,
    src: `https://player.captivate.fm/${embed.kind}/${embed.id}`,
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
