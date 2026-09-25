import { getPathSegments, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'nbcnews'

const nbcnewsHosts = ['nbcnews.com']

// NBC writes the `mmvo` prefix itself and the widget id is bare digits, so the two routes never
// spell each other. They name one video all the same: `widget/video-embed/{digits}` 301s onto
// `embedded-video/mmvo{the same digits}`, and a digit string absent from the catalogue 404s on
// both. So the prefixed form is the key, and the widget route's bare digits gain the prefix.
const embeddedVideoIdRegex = /^mmvo\d+$/
const widgetVideoIdRegex = /^\d+$/

const idPrefix = 'mmvo'

// nbcnews.com/id/{digits} is the retired Flash player's own page id, a space both video routes
// 404 on, so a bare number names a video only under one of these two routes.
const nbcnewsRoutes = toMap({
  'news/embedded-video': embeddedVideoIdRegex,
  'widget/video-embed': widgetVideoIdRegex,
})

const nbcnewsResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const route = segments.slice(0, -1).join('/')
  const idRegex = nbcnewsRoutes.get(route)

  if (!idRegex) {
    return
  }

  const id = keepIfMatches(segments.at(-1), idRegex)

  if (!id) {
    return
  }

  return {
    provider,
    id: id.startsWith(idPrefix) ? id : `${idPrefix}${id}`,
    src: `https://www.nbcnews.com/${route}/${id}`,
  }
}

// NBC News' own video player, nbcnews.com/news/embedded-video/mmvo{id} and the earlier
// nbcnews.com/widget/video-embed/{id}.
export const nbcnewsEmbedResolver = createUrlEmbedResolver(nbcnewsHosts, nbcnewsResolveEmbed)
