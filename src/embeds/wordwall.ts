import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const wordwallHosts = ['wordwall.net']

const activityIdRegex = /^[0-9a-f]+$/i

// `themeId` picks the skin, `templateId` the activity type the author converted to, and
// `fontStackId` the lettering, so the query selects which rendering of the activity plays.
const renderingParams = ['themeId', 'templateId', 'fontStackId']

const extractActivityId = (link: string): string | undefined => {
  const segments = getPathSegments(link)
  // Wordwall serves the same activity at `/embed/{id}` and at `/{lang}/embed/{id}`, where the
  // locale prefix only picks the player's interface language.
  const idIndex = segments[0] === 'embed' ? 1 : 2

  if (segments[idIndex - 1] !== 'embed') {
    return
  }

  return keepIfMatches(segments[idIndex], activityIdRegex)
}

// Wordwall's activity player, a classroom quiz or game a teacher's post pastes under a lesson.
const wordwallResolveEmbed: ResolveEmbed = (url) => {
  const activityId = extractActivityId(url)

  if (!activityId) {
    return
  }

  // No thumbnail offline: the embed page's `og:image` on `screens.cdn.wordwall.net` is keyed by
  // a hash that appears nowhere in the embed url.
  // No separate page either: that page states the embed url itself as its `og:url`.
  return {
    provider: 'wordwall',
    id: activityId,
    src: `https://wordwall.net/embed/${activityId}${pickUrlParams(url, renderingParams)}`,
  }
}

export const wordwallEmbedResolver = createUrlEmbedResolver(wordwallHosts, wordwallResolveEmbed)
