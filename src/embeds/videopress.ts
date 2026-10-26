import { encodePathSegment, getPathSegments, getQueryParam, isAnyOf, isHostOf } from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'videopress'

const sizes = {
  player: { ratio: '16/9' },
}

// Not wordpress.com itself: every blog frames its posts on that domain, and those are cards.
// `video.wordpress.com` is the documented player host, the one its oEmbed writes, and the Flash
// player lived on `s0.videopress.com`, `v0.wordpress.com` and `v.wordpress.com`.
const hosts = ['videopress.com', 'video.wordpress.com', 'v0.wordpress.com', 'v.wordpress.com']

// Where playback starts and whether it loops. The rest of the query the block editor writes goes
// with the rebuilt src: `hd` picks the rendition, `cover` and `useAverageColor` style the player.
const videopressEmbedParams = ['at', 'loop']

const composeEmbed = (guid: string, query = ''): EmbedResolverResult => {
  return {
    provider,
    id: guid,
    src: `https://video.wordpress.com/embed/${guid}${query}`,
    url: `https://videopress.com/v/${guid}`,
    ...sizes.player,
  }
}

// The poster where the player url names none, and the title where the carrier states none, live
// behind `public-api.wordpress.com/rest/v1.1/videos/{guid}`, which answers with no key.
const videopressResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const [route, guid] = getPathSegments(url)

  if (!isAnyOf(route, ['embed', 'v'])) {
    return
  }

  if (!guid) {
    return
  }

  return {
    ...composeEmbed(guid, pickUrlParams(url, videopressEmbedParams)),
    // The block editor writes the poster the publisher chose into the player url.
    thumbnail: getQueryParam(url.searchParams, 'posterUrl'),
    title: attr(element, 'title'),
  }
}

// A VideoPress player iframe, or a frame of its /v/ page, which serves the same player.
export const videopressIframeEmbedResolver = createUrlEmbedResolver(hosts, videopressResolveEmbed)

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
export const readVideopressEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, hosts)

  return url ? videopressResolveEmbed(url)?.src : undefined
}

// `player.swf`, and `flvplayer.swf` under the video plugin path of the first WordPress.com snippet.
const flashPlayerPathRegex = /\/(?:flv)?player\.swf$/i

// The host that served the swf at a bare `/{guid}` path, the snippet's other spelling.
const guidPathHosts = ['v.wordpress.com']

const videopressFlashResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (flashPlayerPathRegex.test(url.pathname)) {
    // The guid comes out of its flashvar or query decoded, and it goes into a path.
    const guid = encodePathSegment(
      flashVar(element, 'guid') ?? getQueryParam(url.searchParams, 'guid') ?? '',
    )

    if (!guid) {
      return
    }

    return composeEmbed(guid)
  }

  const [guid, extra] = getPathSegments(url)

  // A guid never holds a dot, so a segment with one is a file at the root, such as a swf.
  if (!isHostOf(url, guidPathHosts) || !guid || extra || guid.includes('.')) {
    return
  }

  return composeEmbed(guid)
}

// The VideoPress Flash player, dead since Flash. The guid sits in `flashvars="guid=…"` on the
// `<embed>`, on the player's own query where the snippet inlined it, or as the whole path of
// `v.wordpress.com`. A swf src otherwise carries only the player version.
export const videopressFlashEmbedResolver = createUrlEmbedResolver(
  hosts,
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
  { provider, field: 'title', drop: 'VideoPress videospiller' },
  { provider, field: 'title', drop: 'Trình phát video VideoPress' },
]

// Starts playback on the click that loads the player. The player's routes read the boolean
// keys `1`, `true` and empty, and alias `autoplay` to this spelling.
export const videopressRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoPlay: '1' },
}
