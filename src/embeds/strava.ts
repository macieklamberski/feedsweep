import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'strava'

const safeEmbedIdRegex = /^\d+$/

// The two kinds the corpus carries, and the page each one embeds. A kind outside them is left
// alone: the endpoint takes the kind as a path segment, so an unmeasured one would mint a url
// nobody has seen answer.
const embedPages = {
  activity: 'activities',
  route: 'routes',
} as const

type EmbedKind = keyof typeof embedPages

const isEmbedKind = (kind: string): kind is EmbedKind => {
  return kind in embedPages
}

// `embed.js` writes the frame at `height: 650px` over a width the container chooses, then resizes
// it from a height the player posts back. That message rides a per-load channel id the host
// generates, so the settled height is out of reach here. The two hydrated frames the corpus
// carries state 730 and 595, which is the spread the loader's own figure sits in.
const playerHeight = 650

const composeEmbed = (kind: EmbedKind, embedId: string): EmbedResolverResult => {
  return {
    provider,
    id: `${kind}/${embedId}`,
    src: `https://strava-embeds.com/${kind}/${embedId}`,
    url: `https://www.strava.com/${embedPages[kind]}/${embedId}`,
    height: playerHeight,
  }
}

// The inert div the publisher pastes, which `embed.js` replaces with the frame it composes from
// these same two attributes. Without the script the div renders as nothing.
export const stravaPlaceholderEmbedResolver = createMarkupEmbedResolver(
  'div.strava-embed-placeholder[data-embed-type][data-embed-id]',
  (element) => {
    const kind = attr(element, 'data-embed-type') ?? ''
    const embedId = keepIfMatches(attr(element, 'data-embed-id'), safeEmbedIdRegex)

    if (!isEmbedKind(kind) || !embedId) {
      return
    }

    return composeEmbed(kind, embedId)
  },
)

// The retired apex embed, `strava.com/activities/{id}/embed/{token}`, which answers the same 404
// for a real token and a fabricated one. The activity id survives the move to the current host
// and the token does not, so it is dropped.
export const stravaResolveEmbed: ResolveEmbed = (url) => {
  const [route, activityId, embed] = getPathSegments(url)

  if (route !== 'activities' || embed !== 'embed') {
    return
  }

  const embedId = keepIfMatches(activityId, safeEmbedIdRegex)

  return embedId ? composeEmbed('activity', embedId) : undefined
}

// The publisher's box was measured against a player that no longer answers, so the current
// player's own height outranks it here.
export const stravaIframeEmbedResolver = createUrlEmbedResolver(
  ['strava.com'],
  stravaResolveEmbed,
  { preferResolverSize: true },
)
