import { getPathSegments, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'nbcnews'

const nbcnewsHosts = ['nbcnews.com']

// NBC writes the `mmvo` prefix itself and the widget id is bare digits, so the two spaces never
// spell each other. A length band would refuse the next id generation, and a wrong id 404s anyway.
const embeddedVideoIdRegex = /^mmvo\d+$/
const widgetVideoIdRegex = /^\d+$/

// nbcnews.com/id/{digits} is the retired Flash player's own page id, a space both video routes
// 404 on, so a bare number names a video only under one of these two routes.
const nbcnewsRoutes = toMap({
  'news/embedded-video': embeddedVideoIdRegex,
  'widget/video-embed': widgetVideoIdRegex,
})

// No thumbnail: NBC's poster is an opaque media-cldnry.s-nbcnews.com upload path the video id
// does not compose.
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

  // The id keeps the form NBC wrote: enrichment receives the provider and the id alone, and the
  // `mmvo` prefix is what names the route the id sits on.
  return {
    provider,
    id,
    src: `https://www.nbcnews.com/${route}/${id}`,
  }
}

// NBC News' own video player, nbcnews.com/news/embedded-video/mmvo{id} and the earlier
// nbcnews.com/widget/video-embed/{id}.
export const nbcnewsEmbedResolver = createUrlEmbedResolver(nbcnewsHosts, nbcnewsResolveEmbed)
