import { encodePathSegment, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'indavideo'

const sizes = {
  player: { ratio: '16/9' },
}

const hosts = ['indavideo.hu']

const playerPathRegex = /^\/player\/video\/([^/]+)\/?$/i

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

  if (!isAnyOf(url.pathname, flashPlayerPaths)) {
    return
  }

  const flashId = getQueryParam(url.searchParams, 'vID') ?? flashVar(element, 'vID')

  // The Flash id comes out of its query or flashvars decoded, and it goes into a path.
  if (!flashId) {
    return
  }

  return encodePathSegment(flashId)
}

// An Indavideo player: the iframe on indavideo.hu or embed.indavideo.hu, or the retired Flash
// player, whose video id plays on the current one.
export const indavideoResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const id = readVideoId(url, element)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://indavideo.hu/player/video/${id}/`,
    url: `https://indavideo.hu/video/${id}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const indavideoEmbedResolver = createUrlEmbedResolver(hosts, indavideoResolveEmbed)

export const indavideoFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'indavideo video player' },
]

// The player page writes `autoplay` on its video element when the query carries `autostart=1`.
export const indavideoRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autostart: '1' },
}
