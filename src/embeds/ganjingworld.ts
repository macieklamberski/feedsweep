import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { hyphenatedLettersRegex } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// `ganjing.com` 301s onto `www.ganjingworld.com/embed/{same id}`, so both hosts name one embed.
const ganjingworldHosts = ['ganjingworld.com', 'ganjing.com']

const readVideoId = (url: string): string | undefined => {
  const [first, second, third] = getPathSegments(url)

  // The route word tells an embed from a channel, `/channel`, or a shared post, `/s`.
  if (isAnyOf(first, 'embed')) {
    return second
  }

  if (!isAnyOf(second, 'embed')) {
    return
  }

  // The hyphen tells a locale from the route words that share its slot, such as `live`.
  if (!hyphenatedLettersRegex.test(first ?? '')) {
    return
  }

  return third
}

// No title: the carrier states one, but Gan Jing World is unmeasured, so reading it risks putting
// a player label in the item's title. No thumbnail: the poster is a uuid on a separate cdn and
// nothing composes it from the video id.
const ganjingworldResolveEmbed: ResolveEmbed = (url) => {
  const videoId = readVideoId(url)

  if (!videoId) {
    return
  }

  // The locale is dropped: both locale routes answer 301 to the bare route for the same id.
  return {
    provider: 'ganjingworld',
    id: videoId,
    src: `https://www.ganjingworld.com/embed/${videoId}`,
    url: `https://www.ganjingworld.com/video/${videoId}`,
    ratio: '16/9',
  }
}

// Gan Jing World's share iframe on the canonical host and on the `ganjing.com` mirror, with or
// without a locale segment.
export const ganjingworldEmbedResolver = createUrlEmbedResolver(
  ganjingworldHosts,
  ganjingworldResolveEmbed,
)
