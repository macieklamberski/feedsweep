import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const nprHosts = ['www.npr.org']

// Current ids read `nx-s1-{n}`, and the media half can be `nx-s1-{uuid}` or `nx-s1-{n}-1`.
const safeIdRegex = /^[a-z0-9-]+$/

const composeEmbed = (storyId: string, mediaId: string): EmbedResolverResult | undefined => {
  if (!safeIdRegex.test(storyId) || !safeIdRegex.test(mediaId)) {
    return
  }

  return {
    provider: 'npr',
    id: `${storyId}/${mediaId}`,
    src: `https://www.npr.org/player/embed/${storyId}/${mediaId}`,
    height: 290,
  }
}

// NPR's story player, `npr.org/player/embed/{storyId}/{mediaId}`.
export const nprResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, nprHosts)

  if (!parsed) {
    return
  }

  const [player, embed, storyId, mediaId, ...rest] = getPathSegments(parsed)

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

  // A video pair does not play on the story player.
  if (params.get('t') === 'video') {
    return
  }

  return composeEmbed(params.get('i') ?? '', params.get('m') ?? '')
}

// The Flash carriers state the box of the retired Flash player.
export const nprFlashEmbedResolver = createUrlEmbedResolver(nprHosts, nprFlashResolveEmbed, {
  preferResolverSize: true,
})

export const nprIframeEmbedResolver = createUrlEmbedResolver(nprHosts, nprResolveEmbed)
