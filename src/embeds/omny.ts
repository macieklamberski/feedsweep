import {
  composeQuery,
  getPathSegments,
  getQueryParams,
  includesAnyOf,
  isAnyOf,
  trimObject,
} from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'omny'

const hosts = ['omny.fm']

// The boxes Omny's embed dialog writes: 180 tall for the wide audio player, 560 by 315 for the
// video one, and 500 tall for a playlist, which scrolls its list inside the frame. The square
// layout and the artwork style are dropped with the query that picked them.
const sizes = {
  audio: { height: 180 },
  playlist: { height: 500 },
  video: { ratio: '16/9' },
}

// `/shows/{show}/{clip}/embed` is a clip and `/shows/{show}/playlists/{slug}/embed` a playlist.
// White-label customers serve the same paths from their own domain, which host matching cannot
// reach: those keep the generic placeholder.
export const extractOmnyClip = (link: URL): string | undefined => {
  const [route, ...rest] = getPathSegments(link)

  if (!isAnyOf(route, 'shows') || !isAnyOf(rest.at(-1), 'embed')) {
    return
  }

  const path = rest.slice(0, -1)

  if (path.length < 2) {
    return
  }

  return path.join('/')
}

// media picks the audio or the video rendering of the clip, and t a position in it. style, size,
// the colours and a publisher's autoplay are display and are left out. `Audio` is the default
// rendering, so only `Video` is written.
const omnyEmbedParams = ['media', 't']

export const omnyResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const clip = extractOmnyClip(url)

  if (!clip) {
    return
  }

  const { media, t } = getQueryParams(url.search, omnyEmbedParams)
  // The player reads the value in any case.
  const isVideo = isAnyOf(media, 'video')
  const isPlaylist = includesAnyOf(clip, '/playlists/')
  const isVideoClip = isVideo && !isPlaylist
  const audioSize = isPlaylist ? sizes.playlist : sizes.audio
  const query = composeQuery(trimObject({ media: isVideo ? media : undefined, t }))
  const title = attr(element, 'title')

  return {
    provider,
    id: clip,
    src: `https://omny.fm/shows/${clip}/embed${query}`,
    thumbnail: isPlaylist ? undefined : `https://omny.fm/shows/${clip}/image.jpg`,
    ...(isVideoClip ? sizes.video : audioSize),
    title,
  }
}

// The omny.fm/shows/{show}/{clip}/embed player iframe, often pasted without a height.
export const omnyEmbedResolver = createUrlEmbedResolver(hosts, omnyResolveEmbed)

// Starts playback on the click that loads the player.
export const omnyRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
