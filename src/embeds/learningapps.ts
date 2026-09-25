import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const learningappsHosts = ['learningapps.org']

// Two id spaces share one exercise: a number and an alphanumeric string.
const safeAppIdRegex = /^[a-z0-9]+$/i
const numericAppIdRegex = /^\d+$/

// The current route names the exercise in `app` and the retired one in `id`. Pinning the route
// is what keeps an `id` on any other page of the site from being read as an exercise.
const exerciseRoutes: Record<string, string> = {
  watch: 'app',
  show: 'id',
}

// The icon shard is `1` on both ids measured, which is all the evidence there is for it.
const iconShard = 1

// LearningApps's exercise player, `learningapps.org/watch?app={id}`, and the retired `show?id=`
// spelling, where the same id serves on both. A numeric id also names an icon, minted from the
// id alone, where an alphanumeric one has none.
export const learningappsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, learningappsHosts)
  const [route] = parsed ? getPathSegments(parsed) : []
  const param = route ? exerciseRoutes[route] : undefined
  const appId = param ? parsed?.searchParams.get(param) : undefined

  if (!appId || !safeAppIdRegex.test(appId)) {
    return
  }

  const result: EmbedResolverResult = {
    provider: 'learningapps',
    id: appId,
    src: `https://learningapps.org/watch?app=${appId}`,
  }

  return numericAppIdRegex.test(appId)
    ? { ...result, thumbnail: `https://learningapps.org/appicons/${iconShard}/${appId}.png` }
    : result
}

export const learningappsEmbedResolver = createUrlEmbedResolver(
  learningappsHosts,
  learningappsResolveEmbed,
)
