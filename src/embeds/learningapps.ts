import { composeQuery, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { digitsRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'learningapps'

const sizes = {
  player: { height: 500 },
}

const learningappsHosts = ['learningapps.org']

const exerciseRoutes = ['watch', 'show']
const exerciseParams = ['app', 'v', 'id']

// LearningApps's exercise player, `learningapps.org/watch?app={id}`, and its `show` route and `v`
// and `id` spellings. A numeric id also names its page and its icon. An alphanumeric one keys
// both by an internal number the url does not carry.
export const learningappsResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route] = getPathSegments(url)

  if (!route || !isAnyOf(route, exerciseRoutes)) {
    return
  }

  const param = exerciseParams.find((name) => getQueryParam(url.searchParams, name) !== undefined)
  const appId = param ? getQueryParam(url.searchParams, param) : undefined

  if (!appId) {
    return
  }

  const isNumericAppId = digitsRegex.test(appId)

  // A numeric id answers only on `app`. On `v` or `id` the platform serves an empty stub.
  if (isNumericAppId && param !== 'app') {
    return
  }

  const result: EmbedResolverResult = {
    provider,
    id: appId,
    src: `https://learningapps.org/watch${composeQuery({ app: appId })}`,
    ...sizes.player,
  }

  if (!isNumericAppId) {
    return result
  }

  // The exercise page, which only a numeric id addresses: an alphanumeric one redirects away.
  return {
    ...result,
    url: `https://learningapps.org/${appId}`,
    thumbnail: `https://learningapps.org/appicons/1/${appId}.png`,
  }
}

export const learningappsEmbedResolver = createUrlEmbedResolver(
  learningappsHosts,
  learningappsResolveEmbed,
)
