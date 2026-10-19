import type { ResolveEmbed } from '../types.js'
import { attr, find } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'hudl'

// Listed exactly: vi.hudl.com, vc.hudl.com and static.hudl.com serve the files, and
// vcloud.hudl.com is the separate broadcast product.
const hudlHosts = ['www.hudl.com']

// The server matches the route words in any case and the ids only as written.
const videoPathRegex = /^\/(?:embed\/)?video\/((?:[^/]+\/[^/]+\/)?[^/]+)\/?$/i
const athletePathRegex = /^\/embed\/athlete\/([^/]+)\/highlights\/([^/]+)\/?$/i

// Hudl's highlight player, addressed as `{kind}/{owner}/{id}` or a bare `{id}`. The video page,
// `/video/{video}`, refuses framing and names the same video as the embed route. The athlete
// route names a reel id that does not map onto the video route offline, so it keeps its own.
export const hudlResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, hudlHosts)

  if (!parsed) {
    return
  }

  const video = parsed.pathname.match(videoPathRegex)?.[1]

  if (video) {
    return {
      provider,
      id: `video/${video}`,
      src: `https://www.hudl.com/embed/video/${video}`,
      url: `https://www.hudl.com/video/${video}`,
      ratio: '16/9',
    }
  }

  const athlete = parsed.pathname.match(athletePathRegex)

  if (athlete) {
    const [, athleteId, reel] = athlete

    return {
      provider,
      id: `athlete/${athleteId}/${reel}`,
      src: `https://www.hudl.com/embed/athlete/${athleteId}/highlights/${reel}`,
      ratio: '16/9',
    }
  }
}

export const hudlIframeEmbedResolver = createUrlEmbedResolver(hudlHosts, hudlResolveEmbed)

// The SB Nation snippet: a div holding a "View Link" anchor to the video, which a feed shows as
// that link alone.
export const hudlWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.hudl-embed, div.hudl-highlights-embed',
  (element) => {
    return hudlResolveEmbed(attr(find(element, 'a[href]'), 'href') ?? '')
  },
)
