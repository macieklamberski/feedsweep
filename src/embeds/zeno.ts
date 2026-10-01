import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'zeno'

const zenoHosts = ['zeno.fm']

// Zeno.FM's station widget, `zeno.fm/player/{slug}`. The widget reads the slug from the second
// path segment and loads the station by it, case included, so a later segment changes nothing.
export const zenoResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, zenoHosts)

  if (!parsed) {
    return
  }

  const [route, slug] = getPathSegments(parsed)

  if (route !== 'player' || !slug) {
    return
  }

  return {
    provider,
    id: slug,
    src: `https://zeno.fm/player/${slug}`,
    url: `https://zeno.fm/radio/${slug}/`,
    height: 250,
    title: attr(element, 'title'),
  }
}

export const zenoEmbedResolver = createUrlEmbedResolver(zenoHosts, zenoResolveEmbed)
