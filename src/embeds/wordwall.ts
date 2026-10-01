import { getPathSegments, isHostOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `screens.cdn.wordwall.net` serves the activity images, so only the page hosts are claimed.
const wordwallHosts = ['wordwall.net', 'www.wordwall.net']

const activityIdRegex = /^[0-9a-f]+$/i

const localeRegex = /^[a-z]+(?:-[a-z]+)?$/i

// `templateId` picks the game the activity is played as, over the one the activity stores.
const playParams = ['templateId']

const extractActivityId = (link: string): string | undefined => {
  if (!isHostOf(link, wordwallHosts)) {
    return
  }

  const segments = getPathSegments(link)

  // The older share code framed `/embed/play/{a}/{b}/{c}`, where `{a}{b}` is the numeric
  // activity id and `{c}` a check the server validates, so the player needs all three as written.
  if (segments[0] === 'embed' && segments[1] === 'play') {
    const numbers = segments.slice(2, 5)

    if (numbers.length !== 3) {
      return
    }

    return `play/${numbers.join('/')}`
  }

  // Wordwall serves the same activity at `/embed/{id}` and at `/{lang}/embed/{id}`, where the
  // locale prefix only sets the language of the player strings.
  const locale = segments[0] === 'embed' ? undefined : segments[0]
  const idIndex = locale ? 2 : 1

  if (segments[idIndex - 1] !== 'embed') {
    return
  }

  if (locale && !localeRegex.test(locale)) {
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
    src: `https://wordwall.net/embed/${activityId}${pickUrlParams(url, playParams)}`,
    ratio: '500/380',
  }
}

export const wordwallEmbedResolver = createUrlEmbedResolver(wordwallHosts, wordwallResolveEmbed)
