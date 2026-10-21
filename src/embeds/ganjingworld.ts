import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { localePairRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `ganjing.com` 301s onto `www.ganjingworld.com/embed/{same id}`, so both hosts name one embed.
const ganjingworldHosts = ['ganjingworld.com', 'ganjing.com']

type Video = {
  locale?: string
  id: string
}

const readVideo = (url: string): Video | undefined => {
  const [first, second, third] = getPathSegments(url)

  // The route word tells an embed from a channel, `/channel`, or a shared post, `/s`.
  if (first === 'embed') {
    if (!second) {
      return
    }

    return { id: second }
  }

  if (second !== 'embed') {
    return
  }

  // The hyphen tells a locale from the route words that share its slot, such as `live`.
  const locale = keepIfMatches(first, localePairRegex)

  if (!locale || !third) {
    return
  }

  return { locale, id: third }
}

// No thumbnail: the poster is a uuid on a separate cdn and nothing composes it from the video id.
const ganjingworldResolveEmbed: ResolveEmbed = (url, element) => {
  const video = readVideo(url)

  if (!video) {
    return
  }

  // The locale stays in `src` and `url` and out of the `id`, so one video has one key.
  const prefix = video.locale ? `/${video.locale}` : ''

  return {
    provider: 'ganjingworld',
    id: video.id,
    src: `https://www.ganjingworld.com${prefix}/embed/${video.id}`,
    url: `https://www.ganjingworld.com${prefix}/video/${video.id}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

// Gan Jing World's share iframe on the canonical host and on the `ganjing.com` mirror, with or
// without a locale segment.
export const ganjingworldEmbedResolver = createUrlEmbedResolver(
  ganjingworldHosts,
  ganjingworldResolveEmbed,
)
