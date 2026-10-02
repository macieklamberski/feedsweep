import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'condenast'

const condenastHosts = ['player.cnevids.com', 'player-backend.cnevids.com']

// The loader's own url grammar, with the route words in the only case the server answers.
// `/script/video/{id}.js`, `/iframe/video/{id}` and `/embedjs/{player}/video/{id}.js` end in
// the video, and the oldest `/embed/{id}/{player}` starts with it.
const videoPathRegex = /^\/(?:script|iframe|embed(?:js)?\/[^/]+)\/video\/([^/]+?)(?:\.js)?\/?$/
const legacyPathRegex = /^\/embed(?:js)?\/([^/]+)\/[^/]+\/?$/

// Condé Nast's video player, shared by The New Yorker, Vanity Fair, Wired and the other brands.
// The script embed its share dialog writes names no frame url. `/iframe/video/{id}` is the frame
// url the loader's grammar parses, and it plays the same video.
export const condenastResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, condenastHosts)

  if (!parsed) {
    return
  }

  const id =
    parsed.pathname.match(videoPathRegex)?.[1] ?? parsed.pathname.match(legacyPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://player.cnevids.com/iframe/video/${id}`,
    ratio: '16/9',
  }
}

export const condenastIframeEmbedResolver = createUrlEmbedResolver(
  condenastHosts,
  condenastResolveEmbed,
)

// The script embed, which writes a frame with no `src` and renders nothing in a feed.
export const condenastScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="cnevids.com/"]',
  (element) => {
    return condenastResolveEmbed(attr(element, 'src') ?? '')
  },
)
