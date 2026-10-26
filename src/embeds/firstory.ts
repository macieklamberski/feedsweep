import type { FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'firstory'

// The player moved from `open.firstory.me`, which redirects every path onto `open.firstory.fm`.
const firstoryHosts = ['open.firstory.fm', 'open.firstory.me']

const storyPathRegex = /^\/embed\/story\/([^/]+)\/?$/i

// The episode bar stays this tall at any width.
const playerHeight = 182

// A Firstory episode player.
export const firstoryResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const pathname = url.pathname
  const id = pathname.match(storyPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://open.firstory.fm/embed/story/${id}`,
    url: `https://open.firstory.fm/story/${id}`,
    height: playerHeight,
    title: attr(element, 'title'),
  }
}

export const firstoryEmbedResolver = createUrlEmbedResolver(firstoryHosts, firstoryResolveEmbed)

export const firstoryFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Firstory' },
]
