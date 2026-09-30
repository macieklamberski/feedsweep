import { getPathSegments, trimObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { isPlayerJsReady, playerJsPlayRequest } from '../utils/hints.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'ausha'

const aushaHost = 'ausha.co'

// The v3 player is a fixed height on a fluid width.
const playerHeight = 220

// The v2 widget takes the same ids as the v3 player, so both are minted as the v3 player.
const playerHosts = ['player.ausha.co', 'widget.ausha.co']

export const aushaResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, aushaHost)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  // Both hosts serve their player from the root, spelled either bare or as `index.html`.
  if (
    !playerHosts.includes(parsed.hostname) ||
    (segments.length > 0 && segments[0] !== 'index.html')
  ) {
    return
  }

  // An episode and its show are often named together, and the episode is the finer of the two.
  const podcast = parsed.searchParams.get('podcastId') ?? ''
  const show = parsed.searchParams.get('showId') ?? ''
  const named = [
    ['podcast', podcast],
    ['show', show],
  ].find(([, value]) => value)

  if (!named) {
    return
  }

  const [kind, id] = named

  // The spelling Ausha's share dialog writes, with the start position the frame names.
  const start = parsed.searchParams.get('t') ?? undefined
  const query = composeQuery(trimObject({ [`${kind}Id`]: id, v: '3', t: start }, Boolean))

  return {
    provider,
    // `api.ausha.co/v1/podcasts/{id}` is key-free and answers with the episode's title, show,
    // publication date, description and audio url, and 404s on a fabricated id. There is no
    // matching route for a show, so the kind says which of the two an enricher is holding.
    id: `${kind}/${id}`,
    src: `https://player.ausha.co/${query}`,
    height: playerHeight,
  }
}

// Ausha's v3 player iframe and the v2 widget, both naming the episode or show in the query.
export const aushaEmbedResolver = createUrlEmbedResolver([aushaHost], aushaResolveEmbed, {
  // Carriers state the heights of older layouts, so the player's own height outranks them.
  preferResolverSize: true,
})

export const aushaRenderHint: EmbedRenderHint = {
  provider,
  isReady: isPlayerJsReady,
  requestPlay: playerJsPlayRequest,
}
