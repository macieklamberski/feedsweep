import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'patronite'

const patroniteHosts = ['patronite.pl']

// The widget card stays this tall at any width from 300 up.
const widgetHeight = 306

// Patronite's support widget, framed from `/widget/{slug}/{id}/{size}/{colors}`. The widget
// renders by the numeric id alone, and the slug names the creator page.
export const patroniteResolveEmbed: ResolveUrlEmbed = (url) => {
  const [route, slug, id] = getPathSegments(url)

  if (!isAnyOf(route, 'widget') || !id) {
    return
  }

  return {
    provider,
    id,
    src: url.href,
    url: `https://patronite.pl/${slug}`,
    height: widgetHeight,
  }
}

export const patroniteEmbedResolver = createUrlEmbedResolver(patroniteHosts, patroniteResolveEmbed)
