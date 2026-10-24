import { getAnyOf, getPathSegments, isAnyOf } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { encodePathSegment } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const widgets = ['card.html', 'video.html']

// The card lays out its image, blurb and backer line in a fixed 420-pixel column at every width.
const cardHeight = 420

// Kickstarter's project widgets, `/projects/{creator}/{slug}/widget/card.html` for the project
// card and `/widget/video.html` for the pitch video.
export const kickstarterResolveEmbed: ResolveEmbed = (url, element) => {
  const [route, creator, slug, widgetRoute, kind, ...rest] = getPathSegments(url)
  const widget = getAnyOf(kind, widgets)

  if (!isAnyOf(route, 'projects') || !isAnyOf(widgetRoute, 'widget') || !widget || rest.length) {
    return
  }

  const project = `${encodePathSegment(creator)}/${encodePathSegment(slug)}`

  // Kickstarter's oEmbed endpoint needs a creator segment but answers for any value, so the slug
  // alone keys the project, and an enricher writes it as `/projects/anon/{slug}`.
  return {
    provider: 'kickstarter',
    id: slug,
    src: `https://www.kickstarter.com/projects/${project}/widget/${widget}`,
    url: `https://www.kickstarter.com/projects/${project}`,
    height: widget === 'card.html' ? cardHeight : undefined,
    ratio: widget === 'video.html' ? '16/9' : undefined,
    title: attr(element, 'title'),
  }
}

export const kickstarterEmbedResolver = createUrlEmbedResolver(
  ['www.kickstarter.com'],
  kickstarterResolveEmbed,
)
