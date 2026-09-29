import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `ganjing.com` 301s onto `www.ganjingworld.com/embed/{same id}`, so both hosts name one embed.
const ganjingworldHosts = ['ganjingworld.com', 'ganjing.com']

const videoIdRegex = /^[a-zA-Z0-9]+$/

// The platform's locale segment is case-sensitive: `zh-CN` 301s onto the bare id, `zh-cn` 404s.
// Only the platform's own spelling is claimed, so a lowercase one falls to the generic fallback.
const localeRegex = /^[a-z]{2}-[A-Z]{2}$/

type Video = {
  locale?: string
  id: string
}

const readVideo = (url: string): Video | undefined => {
  const [first, second, third] = getPathSegments(url)

  // The route word tells an embed from a channel, `/channel`, or a shared post, `/s`.
  if (first === 'embed') {
    const id = keepIfMatches(second, videoIdRegex)

    if (!id) {
      return
    }

    return { id }
  }

  if (second !== 'embed') {
    return
  }

  const locale = keepIfMatches(first, localeRegex)
  const id = keepIfMatches(third, videoIdRegex)

  if (!locale || !id) {
    return
  }

  return { locale, id }
}

// No title: the carrier states one, but Gan Jing World is unmeasured, so reading it risks putting
// a player label in the item's title. No thumbnail: the poster is a uuid on a separate cdn and
// nothing composes it from the video id.
const ganjingworldResolveEmbed: ResolveEmbed = (url) => {
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
  }
}

// Gan Jing World's share iframe on the canonical host and on the `ganjing.com` mirror, with or
// without a locale segment. No size: every carrier states its own.
export const ganjingworldEmbedResolver = createUrlEmbedResolver(
  ganjingworldHosts,
  ganjingworldResolveEmbed,
)
