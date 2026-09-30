import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, digitsRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const learningappsHosts = ['learningapps.org']

const exerciseRoutes = ['watch', 'show']
const exerciseParams = ['app', 'v', 'id']

// LearningApps's exercise player, `learningapps.org/watch?app={id}`, and its `show` route and `v`
// and `id` spellings. A numeric id also names its icon. An alphanumeric one keys its icon by an
// internal number the url does not carry.
export const learningappsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url)
  const [route] = parsed ? getPathSegments(parsed) : []

  if (!parsed || !route || !exerciseRoutes.includes(route)) {
    return
  }

  const param = exerciseParams.find((name) => parsed.searchParams.has(name))
  const appId = param ? parsed.searchParams.get(param) : undefined

  if (!appId) {
    return
  }

  const isNumericAppId = digitsRegex.test(appId)

  // A numeric id answers only on `app`. On `v` or `id` the platform serves an empty stub.
  if (isNumericAppId && param !== 'app') {
    return
  }

  const result: EmbedResolverResult = {
    provider: 'learningapps',
    id: appId,
    src: `https://learningapps.org/watch${composeQuery({ app: appId })}`,
  }

  return isNumericAppId
    ? { ...result, thumbnail: `https://learningapps.org/appicons/1/${appId}.png` }
    : result
}

export const learningappsEmbedResolver = createUrlEmbedResolver(
  learningappsHosts,
  learningappsResolveEmbed,
)
