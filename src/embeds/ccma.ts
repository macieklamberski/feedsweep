import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { digitsRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ccma'

const ccmaHosts = [
  '3cat.cat', // The current player frame
  'ccma.cat', // The player frame before the 3Cat rebrand
  'tv3.cat', // The Flash players
]

const embedPathRegex = /^\/+3cat\/video\/(\d+)\/embed\/?$/
const legacyEmbedPathRegex = /^\/+video\/embed\/(super3\/)?(\d+)\/?$/
const audioEmbedPathRegex = /^\/+audio\/embed\/(\d+)\/?$/
const evpPlayerPathRegex = /^\/+ria\/players\//
const svpPlayerPathRegex = /^\/+svp2\/svp2\.swf$/
const svpObjectIdRegex = /^SVP(\d+)IE$/

// The article page answers `x-frame-options: SAMEORIGIN`, so the embed route is the only target
// a reader can frame. The Super3 frame redirects onto its own skin on the `sx3` route.
const composeResult = (
  videoId: string | undefined,
  isSuper3 = false,
): EmbedResolverResult | undefined => {
  if (!videoId || !digitsRegex.test(videoId)) {
    return
  }

  return {
    provider,
    id: videoId,
    src: isSuper3
      ? `https://www.3cat.cat/video/embed/sx3/${videoId}/`
      : `https://www.3cat.cat/3cat/video/${videoId}/embed/`,
    url: `https://www.ccma.cat/video/${videoId}/`,
    ratio: '16/9',
  }
}

// Audio ids are a separate space from video ids, so the key names the kind.
const composeAudioResult = (audioId: string): EmbedResolverResult => {
  return {
    provider,
    id: `audio/${audioId}`,
    src: `https://www.3cat.cat/3cat/audio/${audioId}/embed/`,
  }
}

// The player frame in its 3Cat and CCMA spellings, the CCMA audio frame, and CCMA's two Flash
// players, both dead: the EVP generation carrying `videoid` in its flashvars, and the older SVP2
// carrying `VIDEO_ID`.
export const ccmaResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return
  }

  const framedVideoId = parsed.pathname.match(embedPathRegex)?.[1]

  if (framedVideoId) {
    return composeResult(framedVideoId)
  }

  const legacyFramed = parsed.pathname.match(legacyEmbedPathRegex)

  if (legacyFramed) {
    return composeResult(legacyFramed[2], !!legacyFramed[1])
  }

  const audioId = parsed.pathname.match(audioEmbedPathRegex)?.[1]

  if (audioId) {
    return composeAudioResult(audioId)
  }

  if (evpPlayerPathRegex.test(parsed.pathname)) {
    return composeResult(flashVar(element, 'videoid'))
  }

  if (svpPlayerPathRegex.test(parsed.pathname)) {
    const objectId = attr(element?.closest('object'), 'id')

    return composeResult(flashVar(element, 'VIDEO_ID') ?? objectId?.match(svpObjectIdRegex)?.[1])
  }
}

export const ccmaEmbedResolver = createUrlEmbedResolver(ccmaHosts, ccmaResolveEmbed, {
  preferResolverSize: true,
})
