import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { EmbedRenderHint } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickUrlParams, readOrigin, uuidRegex } from '../utils/urls.js'
import { createMarkupEmbedResolver, readRepairedCarrierUrl } from '../utils/widgets.js'

const provider = 'peertube'

type PeertubeVideo = {
  origin: string
  id: string
  isPlaylist: boolean
}

// The two spellings PeerTube writes a video id in: the uuid, and the 22-character short form its
// short-uuid translator produces over the flickrBase58 alphabet, which holds no 0, O, I or l.
// The shape is the whole guard, since the software runs on thousands of instances and there is no
// host to key on: loosened, it claims any site's /w/{slug} and /videos/watch/{slug}.
const shortIdRegex = /^[1-9A-HJ-NP-Za-km-z]{22}$/

// `/videos/watch/{id}` is the watch page PeerTube served before 4.0 and still answers on.
const videoRoutes = ['embed', 'watch']

// A vertical upload gets the same landscape player as any other: an instance's oEmbed answers
// 560x315 for a video whose own aspectRatio is 0.5625, so a carrier's portrait box never fills.
const playerRatio = '16/9'

const isVideoId = (segment: string | undefined): segment is string => {
  return !!segment && (uuidRegex.test(segment) || shortIdRegex.test(segment))
}

// A playlist's player, `/video-playlists/embed/{id}`, and its watch page, `/w/p/{id}`.
const readPlaylistId = (segments: Array<string>): string | undefined => {
  if (isAnyOf(segments[0], 'w') && isAnyOf(segments[1], 'p')) {
    return segments[2]
  }

  if (isAnyOf(segments[0], 'video-playlists') && isAnyOf(segments[1], 'embed')) {
    return segments[2]
  }
}

const readPathId = (segments: Array<string>): string | undefined => {
  if (isAnyOf(segments[0], 'w')) {
    return segments[1]
  }

  if (isAnyOf(segments[0], 'videos') && isAnyOf(segments[1], videoRoutes)) {
    return segments[2]
  }
}

const parseVideo = (url: URL): PeertubeVideo | undefined => {
  const origin = readOrigin(url)

  if (!origin) {
    return
  }

  const segments = getPathSegments(url)
  const playlistId = readPlaylistId(segments)

  if (isVideoId(playlistId)) {
    return { origin, id: playlistId, isPlaylist: true }
  }

  const id = readPathId(segments)

  if (!isVideoId(id)) {
    return
  }

  return { origin, id, isPlaylist: false }
}

// Where playback starts and stops, and whether it loops. The rest is the reader's to choose.
const peertubeEmbedParams = ['start', 'stop', 'loop']

// The video the playlist player opens on.
const peertubePlaylistParams = ['playlistPosition']

// A PeerTube video or playlist, framed as the bare player or as the watch page. A framed watch
// page loads the instance's whole page, header and comments around the player, so the src is
// rebuilt either way.
export const peertubeEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="/videos/embed/" i], iframe[src*="/videos/watch/" i], iframe[src*="/w/" i], iframe[src*="/video-playlists/embed/" i]',
  (element) => {
    const url = parseUrl(readRepairedCarrierUrl(element))

    if (!url) {
      return
    }

    const video = parseVideo(url)

    if (!video) {
      return
    }

    if (video.isPlaylist) {
      return {
        provider,
        id: `playlist/${video.id}`,
        src: `${video.origin}/video-playlists/embed/${video.id}${pickUrlParams(url, peertubePlaylistParams)}`,
        url: `${video.origin}/w/p/${video.id}`,
        ratio: playerRatio,
        title: attr(element, 'title'),
      }
    }

    // Both watch routes reach the player on the id they carry, which is what the instance's own
    // oEmbed answers with. No thumbnail: the file is named by a second uuid unrelated to the
    // video's, so nothing derives it offline.
    return {
      provider,
      id: video.id,
      src: `${video.origin}/videos/embed/${video.id}${pickUrlParams(url, peertubeEmbedParams)}`,
      url: `${video.origin}/w/${video.id}`,
      ratio: playerRatio,
      title: attr(element, 'title'),
    }
  },
)

// `p2p=0` keeps the player off the peer-to-peer swarm, which the embed page's own notice warns
// reveals the viewer's IP. `autoplay=1` starts playback on the click that loads the player.
export const peertubeRenderHint: EmbedRenderHint = {
  provider,
  params: { p2p: '0' },
  autoplayParams: { autoplay: '1' },
}
