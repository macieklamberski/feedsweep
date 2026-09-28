import { getPathSegments, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { digitsRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'nbcnews'

const nbcnewsHosts = ['nbcnews.com', 'today.com']

// NBC News and TODAY share one player and one `mmvo{digits}` id space. The widget route's bare
// digits and the offsite route's trailing digits 301 onto `/embedded-video/mmvo{digits}`, so
// every route keys to the prefixed form.
const embeddedVideoIdRegex = /^mmvo(\d+)$/
const offsiteIdRegex = /-(\d+)$/

const idPrefix = 'mmvo'

// nbcnews.com/id/{digits} is the retired Flash player's own page id, a space every video route
// 404s on, so a bare number names a video only under one of these routes. Each route mints onto
// its own host, as the prefix followed by the digits.
const nbcnewsRoutes = toMap({
  'news/embedded-video': {
    idRegex: embeddedVideoIdRegex,
    srcPrefix: 'https://www.nbcnews.com/news/embedded-video/mmvo',
  },
  offsite: {
    idRegex: offsiteIdRegex,
    srcPrefix: 'https://www.today.com/embedded-video/mmvo',
  },
  'today/embedded-video': {
    idRegex: embeddedVideoIdRegex,
    srcPrefix: 'https://www.today.com/today/embedded-video/mmvo',
  },
  'widget/video-embed': {
    idRegex: digitsRegex,
    srcPrefix: 'https://www.nbcnews.com/widget/video-embed/',
  },
})

const nbcnewsResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const route = nbcnewsRoutes.get(segments.slice(0, -1).join('/'))

  if (!route) {
    return
  }

  const match = route.idRegex.exec(segments.at(-1) ?? '')

  if (!match) {
    return
  }

  const digits = match[1] ?? match[0]

  return {
    provider,
    id: `${idPrefix}${digits}`,
    src: `${route.srcPrefix}${digits}`,
  }
}

// NBC News' own video player, nbcnews.com/news/embedded-video/mmvo{id} and the earlier
// nbcnews.com/widget/video-embed/{id}, and the same player on today.com/today/embedded-video
// and today.com/offsite/{slug}-{id}.
export const nbcnewsEmbedResolver = createUrlEmbedResolver(nbcnewsHosts, nbcnewsResolveEmbed)
