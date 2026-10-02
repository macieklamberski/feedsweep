import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts, pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'videopress'

// Not wordpress.com itself: every blog frames its posts on that domain, and those are cards.
// `video.wordpress.com` is the documented player host, the one its oEmbed writes, and the Flash
// player lived on `s0.videopress.com`, `v0.wordpress.com` and `v.wordpress.com`.
const videopressHosts = [
  'videopress.com',
  'video.wordpress.com',
  'v0.wordpress.com',
  'v.wordpress.com',
]

// Where playback starts and whether it loops. The rest of the query the block editor writes goes
// with the rebuilt src: `hd` picks the rendition, `cover` and `useAverageColor` style the player.
const videopressEmbedParams = ['at', 'loop']

const composeEmbed = (guid: string, query = ''): EmbedResolverResult => {
  return {
    provider,
    id: guid,
    src: `https://video.wordpress.com/embed/${guid}${query}`,
    url: `https://videopress.com/v/${guid}`,
    ratio: '16/9',
  }
}

// The poster, and the title where the carrier states none, live behind
// `public-api.wordpress.com/rest/v1.1/videos/{guid}`, which answers with no key.
const videopressResolveEmbed: ResolveEmbed = (url, element) => {
  const [route, guid] = getPathSegments(url)

  if (route !== 'embed' && route !== 'v') {
    return
  }

  if (!guid) {
    return
  }

  return {
    ...composeEmbed(guid, pickUrlParams(url, videopressEmbedParams)),
    title: attr(element, 'title'),
  }
}

// A VideoPress player iframe, or a frame of its /v/ page, which serves the same player.
export const videopressIframeEmbedResolver = createUrlEmbedResolver(
  videopressHosts,
  videopressResolveEmbed,
)

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
export const readVideopressEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, videopressHosts)

  return url ? videopressResolveEmbed(url.href)?.src : undefined
}

// `player.swf`, and `flvplayer.swf` under the video plugin path of the first WordPress.com snippet.
const flashPlayerPathRegex = /\/(?:flv)?player\.swf$/i

// The host that served the swf at a bare `/{guid}` path, the snippet's other spelling.
const guidPathHost = 'v.wordpress.com'

const videopressFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  if (flashPlayerPathRegex.test(parsed.pathname)) {
    const guid = flashVar(element, 'guid') ?? parsed.searchParams.get('guid')

    if (!guid) {
      return
    }

    return composeEmbed(guid)
  }

  const [guid, extra] = getPathSegments(parsed.href)

  if (parsed.hostname !== guidPathHost || !guid || extra) {
    return
  }

  return composeEmbed(guid)
}

// The VideoPress Flash player, dead since Flash. The guid sits in `flashvars="guid=…"` on the
// `<embed>`, on the player's own query where the snippet inlined it, or as the whole path of
// `v.wordpress.com`. A swf src otherwise carries only the player version.
export const videopressFlashEmbedResolver = createUrlEmbedResolver(
  videopressHosts,
  videopressFlashResolveEmbed,
)

export const videopressFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'VideoPress Video Player' },
  { provider, field: 'title', drop: 'VideoPress-Video-Player' },
  { provider, field: 'title', drop: 'Lecteur vidéo VideoPress' },
  { provider, field: 'title', drop: 'Reproductor de vídeo VideoPress' },
  { provider, field: 'title', drop: 'Lettore video VideoPress' },
  { provider, field: 'title', drop: 'VideoPress videospeler' },
  { provider, field: 'title', drop: 'VideoPress-videospelare' },
]

// Starts playback on the click that loads the player. The player's routes read the boolean
// keys `1`, `true` and empty, and alias `autoplay` to this spelling.
export const videopressRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoPlay: '1' },
}
