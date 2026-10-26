import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr, find } from '../utils/dom.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'streamable'

// Exact: `cdn-cf-east.streamable.com` and its siblings serve the files.
const hosts = ['streamable.com', 'www.streamable.com']

// The embed `/e/{id}` and the frame the oEmbed answer writes, `/o/{id}`.
const embedRoutes = ['e', 'o']

// The player loops unless `loop=0` turns it off, and seeks to `t`, in seconds, once loaded.
const streamableEmbedParams = ['loop', 't']

const sizes = {
  player: { ratio: '16/9' },
}

// The server matches ids only as written. The share route `/s/{id}/{token}`
// plays the id whatever the token holds.
const readVideoId = (segments: Array<string>): string | undefined => {
  const [route, id] = segments

  if (segments.length === 1) {
    return route
  }

  if (isAnyOf(route, embedRoutes) && segments.length === 2) {
    return id
  }

  if (isAnyOf(route, 's') && segments.length === 3) {
    return id
  }
}

// A Streamable video by its shortcode, framed as the embed, the oEmbed frame, the share route or
// the watch page, and an MLB clip by its slug on `/m/{slug}`, which oEmbed does not answer for.
// No thumbnail: the unsigned image sits on an east or a west CDN host the carrier does not name.
export const streamableResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegments(url)
  const title = attr(element, 'title')

  if (isAnyOf(segments[0], 'm') && segments.length === 2) {
    return {
      provider,
      id: `m/${segments[1]}`,
      src: `https://streamable.com/m/${segments[1]}`,
      ...sizes.player,
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
    ...sizes.player,
    title,
  }
}

export const streamableIframeEmbedResolver = createUrlEmbedResolver(hosts, streamableResolveEmbed, {
  isOnHost: isHostOf,
})

// The SB Nation MLB snippet: a div holding a "View Link" anchor to the clip's page on mlb.com, which
// the site's own page frames as `streamable.com/m/{slug}`. A legacy `/c-{id}` page is left: the
// slug in the frame is not the one in the link.
export const streamableMlbEmbedResolver = createMarkupEmbedResolver(
  'div.mlb\\.com-embed, div.mlb-com-embed',
  (element) => {
    const parsed = parseUrlOnHosts(attr(find(element, 'a[href]'), 'href'), 'www.mlb.com', isHostOf)

    if (!parsed) {
      return
    }

    // The clip's page is `/video/{slug}`, or `/{team}/video/{slug}` on a club's site.
    const segments = getPathSegments(parsed)

    if (segments.length > 3 || !isAnyOf(segments.at(-2), 'video')) {
      return
    }

    return streamableResolveEmbed(new URL(`https://streamable.com/m/${segments.at(-1)}`))
  },
)

// The SB Nation snippet: a div holding a "View Link" anchor to the video, which a feed shows as
// that link alone.
export const streamableWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.streamable-embed',
  (element) => {
    const url = parseUrlOnHosts(attr(find(element, 'a[href]'), 'href'), hosts, isHostOf)

    if (!url) {
      return
    }

    return streamableResolveEmbed(url)
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
