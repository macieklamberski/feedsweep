import { getPathSegments, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'strava'

// The page each player kind embeds, and the player's ratio at its narrowest width, where the
// fixed chrome makes it tallest.
const embedKinds = toMap({
  activity: { page: 'activities', ratio: '300/472' },
  route: { page: 'routes', ratio: '300/531' },
})

// The routes of the retired apex embed, `{route}/{id}/embed/{token}`, and the kind each names.
const retiredEmbedKinds = toMap({
  activities: 'activity',
  runs: 'activity',
})

// The access token the embed generator appends. No other query or fragment value is read.
const embedParams = ['token']

const composeEmbed = (
  kind: string | undefined,
  id: string | undefined,
  query = '',
): EmbedResolverResult | undefined => {
  const embedKind = embedKinds.get(kind ?? '')

  if (!embedKind || !id) {
    return
  }

  return {
    provider,
    id: `${kind}/${id}`,
    src: `https://strava-embeds.com/${kind}/${id}${query}`,
    ...(!query && { url: `https://www.strava.com/${embedKind.page}/${id}` }),
    ratio: embedKind.ratio,
  }
}

// The inert div the publisher pastes, which `embed.js` replaces with the frame it composes from
// these same two attributes. Without the script the div renders as nothing.
export const stravaPlaceholderEmbedResolver = createMarkupEmbedResolver(
  'div.strava-embed-placeholder[data-embed-type][data-embed-id]',
  (element) => {
    return composeEmbed(attr(element, 'data-embed-type'), attr(element, 'data-embed-id'))
  },
)

// The player frame `embed.js` writes, `strava-embeds.com/{kind}/{id}`, and the retired apex
// embed. The id survives the move to the current host and the apex token does not, so it is
// dropped.
export const stravaResolveEmbed: ResolveEmbed = (url) => {
  const [route, id, embed] = getPathSegments(url)
  const retiredKind = retiredEmbedKinds.get(route ?? '')

  if (retiredKind && embed === 'embed') {
    return composeEmbed(retiredKind, id)
  }

  return composeEmbed(route, id, pickUrlParams(url, embedParams))
}

export const stravaIframeEmbedResolver = createUrlEmbedResolver(
  ['strava.com', 'strava-embeds.com'],
  stravaResolveEmbed,
)
