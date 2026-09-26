import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'patronite'

const patroniteHosts = ['patronite.pl']

// The widget card stays this tall at any width from 300 up.
const widgetHeight = 306

// Patronite's support widget, framed from `/widget/{slug}/{id}/{size}/{colors}`. The widget
// renders by the numeric id alone, and the slug names the creator page.
export const patroniteResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, patroniteHosts)

  if (!parsed) {
    return
  }

  const [route, slug, id] = getPathSegments(parsed)

  if (route !== 'widget' || !id) {
    return
  }

  return {
    provider,
    id,
    src: url,
    url: `https://patronite.pl/${slug}`,
    height: widgetHeight,
  }
}

export const patroniteEmbedResolver = createUrlEmbedResolver(patroniteHosts, patroniteResolveEmbed)
