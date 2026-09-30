import { getPathSegments, isHostOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { digitsRegex, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `screens.cdn.wordwall.net` serves the activity images, so only the page hosts are claimed.
const wordwallHosts = ['wordwall.net', 'www.wordwall.net']

const activityIdRegex = /^[0-9a-f]+$/i

const localeRegex = /^[a-z]+(?:-[a-z]+)?$/i

// `themeId` picks the skin, `templateId` the activity type the author converted to, and
// `fontStackId` the lettering, so the query selects which rendering of the activity plays.
const renderingParams = ['themeId', 'templateId', 'fontStackId']

type ActivityPath = {
  locale?: string
  activityId: string
}

const extractActivityPath = (link: string): ActivityPath | undefined => {
  if (!isHostOf(link, wordwallHosts)) {
    return
  }

  const segments = getPathSegments(link)

  // The older share code framed `/embed/play/{a}/{b}/{c}`, where `{a}{b}` is the numeric
  // activity id and `{c}` a check the server validates, so the player needs all three as written.
  if (segments[0] === 'embed' && segments[1] === 'play') {
    const numbers = segments.slice(2, 5)

    if (numbers.length !== 3 || !numbers.every((number) => digitsRegex.test(number))) {
      return
    }

    return { activityId: `play/${numbers.join('/')}` }
  }

  // Wordwall serves the same activity at `/embed/{id}` and at `/{lang}/embed/{id}`, where the
  // locale prefix sets the language of the player strings and of the activity's instructions.
  const locale = segments[0] === 'embed' ? undefined : segments[0]
  const idIndex = locale ? 2 : 1

  if (segments[idIndex - 1] !== 'embed') {
    return
  }

  if (locale && !localeRegex.test(locale)) {
    return
  }

  const activityId = keepIfMatches(segments[idIndex], activityIdRegex)

  if (!activityId) {
    return
  }

  return { locale, activityId }
}

// Wordwall's activity player, a classroom quiz or game a teacher's post pastes under a lesson.
const wordwallResolveEmbed: ResolveEmbed = (url) => {
  const activityPath = extractActivityPath(url)

  if (!activityPath) {
    return
  }

  const { locale, activityId } = activityPath
  const localePrefix = locale ? `/${locale}` : ''

  // No thumbnail offline: the embed page's `og:image` on `screens.cdn.wordwall.net` is keyed by
  // a hash that appears nowhere in the embed url.
  // No separate page either: that page states the embed url itself as its `og:url`.
  return {
    provider: 'wordwall',
    id: activityId,
    src: `https://wordwall.net${localePrefix}/embed/${activityId}${pickUrlParams(url, renderingParams)}`,
  }
}

export const wordwallEmbedResolver = createUrlEmbedResolver(wordwallHosts, wordwallResolveEmbed)
