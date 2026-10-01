import { getPathSegments, toMap } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { digitsRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'nbcnews'

const nbcnewsHosts = ['nbcnews.com', 'today.com']

// NBC News and TODAY share one player and one `mmvo{digits}` id space. The widget route's bare
// digits and the offsite route's trailing digits 301 onto `/embedded-video/mmvo{digits}`, so
// every route keys to the prefixed form.
const embeddedVideoIdRegex = /^mmvo(.+)$/i
const offsiteIdRegex = /-(\d+)$/

const idPrefix = 'mmvo'

// nbcnews.com/id/{digits} is the retired Flash player's own page id, a space every video route
// 404s on, so a bare number names a video only under one of these routes. Each route mints onto
// its own host, as the prefix followed by the digits. The embedded-video routes answer their route
// words and the prefix in any case, while the offsite and widget routes serve lowercase only.
const nbcnewsRoutes = toMap({
  'news/embedded-video': {
    idRegex: embeddedVideoIdRegex,
    srcPrefix: 'https://www.nbcnews.com/news/embedded-video/mmvo',
    isCaseInsensitive: true,
  },
  offsite: {
    idRegex: offsiteIdRegex,
    srcPrefix: 'https://www.today.com/embedded-video/mmvo',
  },
  'today/embedded-video': {
    idRegex: embeddedVideoIdRegex,
    srcPrefix: 'https://www.today.com/today/embedded-video/mmvo',
    isCaseInsensitive: true,
  },
  'widget/video-embed': {
    srcPrefix: 'https://www.nbcnews.com/widget/video-embed/',
  },
})

const nbcnewsResolveEmbed: ResolveEmbed = (url) => {
  const segments = getPathSegments(url)
  const routePath = segments.slice(0, -1).join('/')
  const route = nbcnewsRoutes.get(routePath.toLowerCase())

  if (!route) {
    return
  }

  if (!route.isCaseInsensitive && routePath !== routePath.toLowerCase()) {
    return
  }

  // The widget route names the video by the whole segment.
  const segment = segments.at(-1) ?? ''
  const value = route.idRegex ? route.idRegex.exec(segment)?.[1] : segment

  if (!value) {
    return
  }

  // Only bare digits on the widget route redirect onto `mmvo{digits}`.
  const hasKey = Boolean(route.idRegex) || digitsRegex.test(value)

  return {
    provider,
    id: hasKey ? `${idPrefix}${value}` : undefined,
    src: `${route.srcPrefix}${value}`,
  }
}

// NBC News' own video player, nbcnews.com/news/embedded-video/mmvo{id} and the earlier
// nbcnews.com/widget/video-embed/{id}, and the same player on today.com/today/embedded-video
// and today.com/offsite/{slug}-{id}.
export const nbcnewsEmbedResolver = createUrlEmbedResolver(nbcnewsHosts, nbcnewsResolveEmbed)

export const nbcnewsRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
