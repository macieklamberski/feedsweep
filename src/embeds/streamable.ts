import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, find } from '../utils/dom.js'
import { pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'streamable'

// Exact: `cdn-cf-east.streamable.com` and its siblings serve the files.
const streamableHosts = ['streamable.com', 'www.streamable.com']

// The embed `/e/{id}` and the frame the oEmbed answer writes, `/o/{id}`.
const embedRoutes = new Set(['e', 'o'])

// The player loops unless `loop=0` turns it off.
const streamableEmbedParams = ['loop']

const playerRatio = '16/9'

// The server matches route words and ids only as written. The share route `/s/{id}/{token}`
// plays the id whatever the token holds.
const readVideoId = (segments: Array<string>): string | undefined => {
  const [route, id] = segments

  if (segments.length === 1) {
    return route
  }

  if (embedRoutes.has(route) && segments.length === 2) {
    return id
  }

  if (route === 's' && segments.length === 3) {
    return id
  }
}

// A Streamable video by its shortcode, framed as the embed, the oEmbed frame, the share route or
// the watch page, and an MLB clip by its slug on `/m/{slug}`, which oEmbed does not answer for.
// No thumbnail: the unsigned image sits on an east or a west CDN host the carrier does not name.
export const streamableResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isHostOf(parsed, streamableHosts)) {
    return
  }

  const segments = getPathSegments(parsed)
  const title = attr(element, 'title')

  if (segments[0] === 'm' && segments.length === 2) {
    return {
      provider,
      id: `m/${segments[1]}`,
      src: `https://streamable.com/m/${segments[1]}`,
      ratio: playerRatio,
      title,
    }
  }

  const id = readVideoId(segments)

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://streamable.com/e/${id}${pickUrlParams(url, streamableEmbedParams)}`,
    url: `https://streamable.com/${id}`,
    ratio: playerRatio,
    title,
  }
}

export const streamableIframeEmbedResolver = createUrlEmbedResolver(
  streamableHosts,
  streamableResolveEmbed,
)

// The SB Nation snippet: a div holding a "View Link" anchor to the video, which a feed shows as
// that link alone.
export const streamableWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.streamable-embed',
  (element) => {
    return streamableResolveEmbed(attr(find(element, 'a[href]'), 'href') ?? '')
  },
)

export const streamableFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'streamable video player' },
]

// Starts playback on the click that loads the player, sound on: the player reads `autoplay` off
// its query.
export const streamableRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
