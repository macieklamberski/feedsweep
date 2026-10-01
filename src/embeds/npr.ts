import { getPathSegments, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const nprHosts = ['www.npr.org']

const composeEmbed = (storyId: string, mediaId: string): EmbedResolverResult | undefined => {
  if (!storyId || !mediaId) {
    return
  }

  return {
    provider: 'npr',
    id: `${storyId}/${mediaId}`,
    src: `https://www.npr.org/player/embed/${storyId}/${mediaId}`,
    height: 290,
  }
}

// NPR's video player. The two retired routes redirect to it or name the same pair.
const composeVideoEmbed = (storyId: string, mediaId: string): EmbedResolverResult | undefined => {
  if (!storyId || !mediaId) {
    return
  }

  return {
    provider: 'npr',
    id: `video/${storyId}/${mediaId}`,
    src: `https://www.npr.org/embedded-video${composeQuery({ storyId, mediaId })}`,
    ratio: '16/9',
  }
}

// The query names each video route reads the story and the media from.
const videoRoutes = toMap({
  'embedded-video': ['storyId', 'mediaId'],
  'player/embeddable/video/player.html': ['i', 'm'],
  'templates/event/embeddedVideo.php': ['storyId', 'mediaId'],
})

// NPR's story player, `npr.org/player/embed/{storyId}/{mediaId}`, and its video player,
// `npr.org/embedded-video?storyId={storyId}&mediaId={mediaId}`.
export const nprResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, nprHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const videoRoute = videoRoutes.get(segments.join('/'))

  if (videoRoute) {
    const [storyName, mediaName] = videoRoute

    return composeVideoEmbed(
      parsed.searchParams.get(storyName) ?? '',
      parsed.searchParams.get(mediaName) ?? '',
    )
  }

  const [player, embed, storyId, mediaId, ...rest] = segments

  if (player !== 'player' || embed !== 'embed' || rest.length) {
    return
  }

  return composeEmbed(storyId ?? '', mediaId ?? '')
}

// The retired Flash player, `npr.org/v2/?i={storyId}&m={mediaId}&t={kind}`.
export const nprFlashResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, nprHosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  if (segments.length !== 1 || segments[0] !== 'v2') {
    return
  }

  // Some carriers join the query with `;`, so `m` would read `365995120;t=audio`.
  const params = new URLSearchParams(parsed.search.replaceAll(';', '&'))

  const storyId = params.get('i') ?? ''
  const mediaId = params.get('m') ?? ''

  // A video pair plays on the video player only.
  if (params.get('t') === 'video') {
    return composeVideoEmbed(storyId, mediaId)
  }

  // The pair comes out of the query decoded, and it goes into a path beside the raw path spelling.
  return composeEmbed(encodePathSegment(storyId), encodePathSegment(mediaId))
}

// The Flash carriers state the box of the retired Flash player.
export const nprFlashEmbedResolver = createUrlEmbedResolver(nprHosts, nprFlashResolveEmbed, {
  preferResolverSize: true,
})

export const nprIframeEmbedResolver = createUrlEmbedResolver(nprHosts, nprResolveEmbed)
