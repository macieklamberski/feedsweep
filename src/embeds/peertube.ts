import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { EmbedRenderHint } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, readCarrierUrl } from '../utils/widgets.js'

const provider = 'peertube'

type PeertubeVideo = {
  origin: string
  id: string
}

// A javascript: url parses with a matching pathname, and its origin is the string null.
const embeddableProtocols = ['https:', 'http:']

// The two spellings PeerTube writes a video id in: the uuid, and the 22-character short form its
// short-uuid translator produces over the flickrBase58 alphabet, which holds no 0, O, I or l.
// The shape is the whole guard, since the software runs on thousands of instances and there is no
// host to key on: loosened, it claims any site's /w/{slug} and /videos/watch/{slug}.
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const shortIdRegex = /^[1-9A-HJ-NP-Za-km-z]{22}$/

// `/videos/watch/{id}` is the watch page PeerTube served before 4.0 and still answers on.
const videoRoutes = new Set(['embed', 'watch'])

// A vertical upload gets the same landscape player as any other: an instance's oEmbed answers
// 560x315 for a video whose own aspectRatio is 0.5625, so a carrier's portrait box never fills.
const playerRatio = '16/9'

const isVideoId = (segment: string | undefined): segment is string => {
  return !!segment && (uuidRegex.test(segment) || shortIdRegex.test(segment))
}

const readPathId = (segments: Array<string>): string | undefined => {
  if (segments[0] === 'w') {
    return segments[1]
  }

  if (segments[0] === 'videos' && videoRoutes.has(segments[1])) {
    return segments[2]
  }
}

const parseVideo = (link: string): PeertubeVideo | undefined => {
  const url = parseUrl(link)

  if (!url || !isAnyOf(url.protocol, embeddableProtocols)) {
    return
  }

  const id = readPathId(getPathSegments(url))

  if (!isVideoId(id)) {
    return
  }

  return { origin: url.origin, id }
}

// Where playback starts and stops, and the subtitle track. The rest of the query sets the
// player's chrome, which is the reader's to choose.
const peertubeEmbedParams = ['start', 'stop', 'subtitle']

// A PeerTube video, framed as the bare player or as the watch page. A framed watch page loads the
// instance's whole page, header and comments around the player, so the src is rebuilt either way.
export const peertubeEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="/videos/embed/"], iframe[src*="/videos/watch/"], iframe[src*="/w/"]',
  (element) => {
    const link = readCarrierUrl(element)
    const video = parseVideo(link)

    if (!video) {
      return
    }

    // Both watch routes reach the player on the id they carry, which is what the instance's own
    // oEmbed answers with. No thumbnail: the file is named by a second uuid unrelated to the
    // video's, so nothing derives it offline.
    return {
      provider,
      id: video.id,
      src: `${video.origin}/videos/embed/${video.id}${pickUrlParams(link, peertubeEmbedParams)}`,
      url: `${video.origin}/w/${video.id}`,
      ratio: playerRatio,
      title: attr(element, 'title'),
    }
  },
  { preferResolverSize: true },
)

// `p2p=0` keeps the player off the peer-to-peer swarm, which the embed page's own notice warns
// reveals the viewer's IP. `autoplay=1` starts playback on the click that loads the player.
export const peertubeRenderHint: EmbedRenderHint = {
  provider,
  params: { p2p: '0' },
  autoplayParams: { autoplay: '1' },
}
