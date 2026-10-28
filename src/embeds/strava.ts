import { encodePathSegment, getPathSegments, isAnyOf, toMap } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'strava'

// The player's ratio at its narrowest width, where the fixed chrome makes it tallest.
const sizes = {
  activity: { ratio: '300/472' },
  route: { ratio: '300/531' },
  // The segment leaderboard and the athlete widget, each a fixed height at every width.
  segment: { height: 381 },
  rides: { height: 454 },
}

// The page each player kind embeds, and its size.
const embedKinds = toMap({
  activity: { page: 'activities', size: sizes.activity },
  route: { page: 'routes', size: sizes.route },
})

// The routes of the retired apex embed, `{route}/{id}/embed/{token}`, and the kind each names.
const retiredEmbedKinds = toMap({
  activities: 'activity',
  runs: 'activity',
})

// The access token the embed generator appends. No other query or fragment value is read.
const embedParams = ['token']

const composeEmbed = (
  rawKind: string | undefined,
  id: string | undefined,
  query = '',
): EmbedResolverResult | undefined => {
  const kind = rawKind?.toLowerCase() ?? ''
  const embedKind = embedKinds.get(kind)

  if (!embedKind || !id) {
    return
  }

  return {
    provider,
    id: `${kind}/${id}`,
    src: `https://strava-embeds.com/${kind}/${id}${query}`,
    ...(!query && { url: `https://www.strava.com/${embedKind.page}/${id}` }),
    ...embedKind.size,
  }
}

// The inert div the publisher pastes, which `embed.js` replaces with the frame it composes from
// these same two attributes. Without the script the div renders as nothing.
export const stravaPlaceholderEmbedResolver = createMarkupEmbedResolver(
  'div.strava-embed-placeholder[data-embed-type][data-embed-id]',
  (element) => {
    // The id comes out of its attribute decoded, and it goes into a path.
    const id = encodePathSegment(attr(element, 'data-embed-id') ?? '')

    return composeEmbed(attr(element, 'data-embed-type'), id)
  },
)

// The player frame `embed.js` writes, `strava-embeds.com/{kind}/{id}`, the retired apex embed,
// and the segment and athlete widgets the apex still serves. The id survives the move to the
// current host and the apex token does not, so it is dropped.
export const stravaResolveEmbed: ResolveUrlEmbed = (url) => {
  const segments = getPathSegments(url)
  const [route, id, embed, token] = segments
  const retiredKind = retiredEmbedKinds.get(route?.toLowerCase() ?? '')

  // A segment's leaderboard, which serves on the apex alone: `strava-embeds.com` answers 404.
  if (isAnyOf(route, 'segments') && id && isAnyOf(embed, 'embed') && segments.length === 3) {
    return {
      provider,
      id: `segment/${id}`,
      src: `https://www.strava.com/${route}/${id}/${embed}`,
      url: `https://www.strava.com/${route}/${id}`,
      ...sizes.segment,
    }
  }

  // An athlete's latest activities, which serves on the apex alone. The token is the widget's
  // only address, so no page url goes beside it.
  const isRides = isAnyOf(route, 'athletes') && isAnyOf(embed, 'latest-rides')

  if (isRides && id && token && segments.length === 4) {
    return {
      provider,
      id: `athlete/${id}`,
      src: `https://www.strava.com/${route}/${id}/${embed}/${token}`,
      ...sizes.rides,
    }
  }

  if (retiredKind && isAnyOf(embed, 'embed')) {
    return composeEmbed(retiredKind, id)
  }

  return composeEmbed(route, id, pickUrlParams(url, embedParams))
}

export const stravaIframeEmbedResolver = createUrlEmbedResolver(
  ['strava.com', 'strava-embeds.com'],
  stravaResolveEmbed,
)
