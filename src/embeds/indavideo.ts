import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'indavideo'

const indavideoHosts = ['indavideo.hu']

const playerPathRegex = /^\/player\/video\/([^/]+)\/?$/

// The retired Flash players, which name the video in a `vID` flashvar or query value.
const flashPlayerPaths = [
  '/player/gup.swf', // files.indavideo.hu
  '/player/vc_o.swf', // files.indavideo.hu
  '/swf/player.swf', // assets.indavideo.hu
]

const readVideoId = (url: URL, element?: Element): string | undefined => {
  const playerId = url.pathname.match(playerPathRegex)?.[1]

  if (playerId) {
    return playerId
  }

  if (!flashPlayerPaths.includes(url.pathname)) {
    return
  }

  return url.searchParams.get('vID') ?? flashVar(element, 'vID')
}

// An Indavideo player: the iframe on indavideo.hu or embed.indavideo.hu, or the retired Flash
// player, whose video id plays on the current one.
export const indavideoResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, indavideoHosts)

  if (!parsed) {
    return
  }

  const id = readVideoId(parsed, element)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://indavideo.hu/player/video/${id}/`,
    url: `https://indavideo.hu/video/${id}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

export const indavideoEmbedResolver = createUrlEmbedResolver(indavideoHosts, indavideoResolveEmbed)

export const indavideoFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'indavideo video player' },
]

// The player page writes `autoplay` on its video element when the query carries `autostart=1`.
export const indavideoRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autostart: '1' },
}
