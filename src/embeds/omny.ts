import { getPathSegments, parseUrl, trimObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'omny'

const omnyHosts = ['omny.fm']

// The boxes Omny's embed dialog writes: 180 tall for the wide audio player, 560 by 315 for the
// video one. The square layout and the artwork style are dropped with the query that picked them.
// A playlist grows with its list, so it states none.
const audioHeight = 180
const videoRatio = '16/9'

// `/shows/{show}/{clip}/embed` is a clip and `/shows/{show}/playlists/{slug}/embed` a playlist.
// White-label customers serve the same paths from their own domain, which host matching cannot
// reach: those keep the generic placeholder.
export const extractOmnyClip = (link: string): string | undefined => {
  const segments = getPathSegments(link)

  if (segments[0] !== 'shows' || segments[segments.length - 1] !== 'embed') {
    return
  }

  const path = segments.slice(1, -1)

  if (path.length < 2) {
    return
  }

  return path.join('/')
}

// media picks the audio or the video rendering of the clip, and t a position in it. style, size,
// the colours and a publisher's autoplay are display and are left out. `Audio` is the default
// rendering, so only `Video` is written.
const omnyEmbedParams = ['media', 't']

export const omnyResolveEmbed: ResolveEmbed = (url, element) => {
  const clip = extractOmnyClip(url)

  if (!clip) {
    return
  }

  const { media, t } = pickQueryParams(
    parseUrl(url, placeholderBaseUrl)?.search ?? '',
    omnyEmbedParams,
  )
  // The player reads the value in any case.
  const isVideo = media?.toLowerCase() === 'video'
  const isPlaylist = clip.includes('/playlists/')
  const query = composeQuery(trimObject({ media: isVideo ? media : undefined, t }))
  const title = attr(element, 'title')

  return {
    provider,
    id: clip,
    src: `https://omny.fm/shows/${clip}/embed${query}`,
    height: isVideo || isPlaylist ? undefined : audioHeight,
    ratio: isVideo && !isPlaylist ? videoRatio : undefined,
    title,
  }
}

// The omny.fm/shows/{show}/{clip}/embed player iframe, often pasted without a height.
export const omnyEmbedResolver = createUrlEmbedResolver(omnyHosts, omnyResolveEmbed)

// Starts playback on the click that loads the player.
export const omnyRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
