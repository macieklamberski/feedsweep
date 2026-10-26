import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'zeno'

const sizes = {
  player: { height: 250 },
}

const hosts = ['zeno.fm']

// Zeno.FM's station widget, `zeno.fm/player/{slug}`. The widget reads the slug from the second
// path segment and loads the station by it, case included, so a later segment changes nothing.
export const zenoResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const [route, slug] = getPathSegments(url)

  if (!isAnyOf(route, 'player') || !slug) {
    return
  }

  return {
    provider,
    id: slug,
    src: `https://zeno.fm/player/${slug}`,
    url: `https://zeno.fm/radio/${slug}/`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const zenoEmbedResolver = createUrlEmbedResolver(hosts, zenoResolveEmbed)
