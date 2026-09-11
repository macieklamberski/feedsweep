import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { keepIfMatches } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `ganjing.com` 301s onto `www.ganjingworld.com/embed/{same id}`, so both hosts name one embed.
const ganjingworldHosts = ['ganjingworld.com', 'ganjing.com']

const videoIdRegex = /^[a-zA-Z0-9]+$/

// The platform's own locale segment is case-sensitive: `zh-CN` 301s onto the bare id, `zh-cn` 404s.
const localeRegex = /^[a-z]{2}-[a-z]{2}$/i

const readVideoId = (url: string): string | undefined => {
  const [first, second, third] = getPathSegments(url)

  // The route word tells an embed from a channel, `/channel`, or a shared post, `/s`.
  if (first === 'embed') {
    return keepIfMatches(second, videoIdRegex)
  }

  if (second === 'embed' && keepIfMatches(first, localeRegex)) {
    return keepIfMatches(third, videoIdRegex)
  }
}

// No title: the carrier states one, but Gan Jing World is unmeasured, so reading it risks putting
// a player label in the item's title. No thumbnail: the poster is a uuid on a separate cdn and
// nothing composes it from the video id.
const ganjingworldResolveEmbed: ResolveEmbed = (url) => {
  const videoId = readVideoId(url)

  if (!videoId) {
    return
  }

  return {
    provider: 'ganjingworld',
    id: videoId,
    src: `https://www.ganjingworld.com/embed/${videoId}`,
    url: `https://www.ganjingworld.com/video/${videoId}`,
  }
}

// Gan Jing World's share iframe on the canonical host and on the `ganjing.com` mirror, with or
// without a locale segment. No size: every carrier states its own.
export const ganjingworldEmbedResolver = createUrlEmbedResolver(
  ganjingworldHosts,
  ganjingworldResolveEmbed,
)
