import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { lettersRegex, uuidRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'captivate'

// The boxes Captivate's snippets write: 200 tall for an episode, and 600 for a show, which scrolls
// its episode list inside the frame. A kind added later gets the episode's.
const sizes = { episode: { height: 200 }, show: { height: 600 } }

const captivateHosts = ['captivate.fm']

export const extractCaptivateEmbed = (link: URL): { kind: string; id: string } | undefined => {
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
export const captivateResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const embed = extractCaptivateEmbed(url)

  if (!embed) {
    return
  }

  return {
    provider,
    id: `${embed.kind}/${embed.id}`,
    src: `https://player.captivate.fm/${embed.kind}/${embed.id}`,
    ...(isAnyOf(embed.kind, 'show') ? sizes.show : sizes.episode),
    title: attr(element, 'title'),
  }
}

export const captivateEmbedResolver = createUrlEmbedResolver(captivateHosts, captivateResolveEmbed)

// The player takes no query to start. Its own embed API posts this action into the frame, and
// the frame posts nothing first, so the request goes on load.
export const captivateRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: { action: 'CP.API.PLAY' },
}
