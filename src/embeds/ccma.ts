import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ccma'

// The Flash carriers sit on the broadcaster's old domain, and the modern snippet frames the
// route this module mints, which is on the current one.
const ccmaHosts = ['tv3.cat', '3cat.cat']

const safeVideoIdRegex = /^\d+$/

const embedPathRegex = /^\/+3cat\/video\/(\d+)\/embed\/?$/
const evpPlayerPathRegex = /^\/+ria\/players\//
const svpPlayerPathRegex = /^\/+svp2\/svp2\.swf$/
// The SVP2 object writes its video nowhere but the DOM id it carries for scripting.
const svpObjectIdRegex = /^SVP(\d+)IE$/

// The article page answers `x-frame-options: SAMEORIGIN`, so the embed route is the only target
// a reader can frame.
const composeResult = (videoId: string | undefined): EmbedResolverResult | undefined => {
  if (!videoId || !safeVideoIdRegex.test(videoId)) {
    return
  }

  return {
    provider,
    id: videoId,
    src: `https://www.3cat.cat/3cat/video/${videoId}/embed/`,
    url: `https://www.ccma.cat/video/${videoId}/`,
  }
}

// The modern player frame, and CCMA's two Flash players, both dead: the EVP generation carrying
// `videoid` in its flashvars, and the older SVP2 carrying the same id space in the object's `id`.
export const ccmaResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, ccmaHosts)

  if (!parsed) {
    return
  }

  const framedVideoId = parsed.pathname.match(embedPathRegex)?.[1]

  if (framedVideoId) {
    return composeResult(framedVideoId)
  }

  if (evpPlayerPathRegex.test(parsed.pathname)) {
    return composeResult(flashVar(element, 'videoid'))
  }

  if (svpPlayerPathRegex.test(parsed.pathname)) {
    const objectId = attr(element?.closest('object'), 'id')

    return composeResult(objectId?.match(svpObjectIdRegex)?.[1])
  }
}

export const ccmaEmbedResolver = createUrlEmbedResolver(ccmaHosts, ccmaResolveEmbed)
