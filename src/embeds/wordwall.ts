import { composeQuery, getPathSegments, getQueryParams, isAnyOf, isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { hexRegex, hyphenatedLettersRegex, lettersRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'wordwall'

const sizes = {
  player: { ratio: '500/380' },
}

// `screens.cdn.wordwall.net` serves the activity images, so only the page hosts are claimed.
const hosts = ['wordwall.net', 'www.wordwall.net']

// `templateId` picks the game the activity is played as, over the one the activity stores.
const playParams = ['templateId']

const extractActivityId = (link: URL): string | undefined => {
  if (!isHostOf(link, hosts)) {
    return
  }

  const segments = getPathSegments(link)
  const [route, playRoute] = segments

  // The older share code framed `/embed/play/{a}/{b}/{c}`, where `{a}{b}` is the numeric
  // activity id and `{c}` a check the server validates, so the player needs all three as written.
  if (isAnyOf(route, 'embed') && isAnyOf(playRoute, 'play')) {
    const numbers = segments.slice(2, 5)

    if (numbers.length !== 3) {
      return
    }

    return `play/${numbers.join('/')}`
  }

  // Wordwall serves the same activity at `/embed/{id}` and at `/{lang}/embed/{id}`, where the
  // locale prefix only sets the language of the player strings.
  const locale = isAnyOf(route, 'embed') ? undefined : route
  const [embedRoute, activityId] = locale ? segments.slice(1) : segments

  if (!isAnyOf(embedRoute, 'embed')) {
    return
  }

  if (locale && !lettersRegex.test(locale) && !hyphenatedLettersRegex.test(locale)) {
    return
  }

  return keepIfMatches(activityId, hexRegex)
}

// Wordwall's activity player, a classroom quiz or game a teacher's post pastes under a lesson.
const wordwallResolveEmbed: ResolveUrlEmbed = (url) => {
  const activityId = extractActivityId(url)

  if (!activityId) {
    return
  }

  // No thumbnail offline: the embed page's `og:image` on `screens.cdn.wordwall.net` is keyed by
  // a hash that appears nowhere in the embed url.
  // No separate page either: that page states the embed url itself as its `og:url`.
  return {
    provider,
    id: activityId,
    src: `https://wordwall.net/embed/${activityId}${composeQuery(getQueryParams(url, playParams))}`,
    ...sizes.player,
  }
}

export const wordwallEmbedResolver = createUrlEmbedResolver(hosts, wordwallResolveEmbed)
