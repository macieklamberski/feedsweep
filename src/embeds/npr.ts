import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const nprHosts = ['npr.org']

const safeIdRegex = /^\d+$/

// The Flash player answers 404 today, and a carrier spelling it without the trailing slash
// reaches the same page.
const flashPlayerPaths = new Set(['/v2/', '/v2'])

const composeEmbed = (storyId: string, mediaId: string): EmbedResolverResult | undefined => {
  if (!safeIdRegex.test(storyId) || !safeIdRegex.test(mediaId)) {
    return
  }

  return {
    provider: 'npr',
    id: `${storyId}/${mediaId}`,
    src: `https://www.npr.org/player/embed/${storyId}/${mediaId}`,
  }
}

// NPR's story player, `npr.org/player/embed/{storyId}/{mediaId}`, and the retired Flash player
// before it, which names the same pair as `i` and `m`.
export const nprResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, nprHosts)

  if (!parsed) {
    return
  }

  if (flashPlayerPaths.has(parsed.pathname)) {
    return composeEmbed(parsed.searchParams.get('i') ?? '', parsed.searchParams.get('m') ?? '')
  }

  const [player, embed, storyId, mediaId, ...rest] = getPathSegments(parsed)

  if (player !== 'player' || embed !== 'embed' || rest.length) {
    return
  }

  return composeEmbed(storyId ?? '', mediaId ?? '')
}

export const nprEmbedResolver = createUrlEmbedResolver(nprHosts, nprResolveEmbed)
