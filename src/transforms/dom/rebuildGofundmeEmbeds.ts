import { composeGofundmeWidgetUrl, readGofundmeSlug } from '../../embeds/gofundme.js'
import type { DomTransform } from '../../types.js'
import { attr, flashVar, isEmptyElement, paramValue } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

const flashWidgetHosts = ['funds.gofundme.com']

// GoFundMe's campaign widget in its three eras, each naming the campaign by its slug: an empty
// div carrying the campaign url in `data-url`, the Flash widget naming it in flashvars `page`,
// and the media widget's empty iframe naming it in `id`. Only their loaders render them.
export const rebuildGofundmeEmbeds: DomTransform = () => (document) => {
  const replaceWithWidget = (element: Element, slug: string): void => {
    element.replaceWith(createIframe(document, composeGofundmeWidgetUrl(slug)))
  }

  for (const element of document.querySelectorAll('div.gfm-embed[data-url]')) {
    // A div that already holds the hydrated player or a donation link keeps what it carries.
    if (!isEmptyElement(element)) {
      continue
    }

    // `gfm` also abbreviates GitHub Flavored Markdown, so the class alone does not name GoFundMe.
    const slug = readGofundmeSlug(attr(element, 'data-url'))

    if (slug) {
      replaceWithWidget(element, slug)
    }
  }

  // An `<embed>` inside an `<object>` is the same widget, replaced with its object.
  for (const element of document.querySelectorAll('object, embed:not(object embed)')) {
    const movie = attr(element, 'src') ?? attr(element, 'data') ?? paramValue(element, 'movie')
    const slug = flashVar(element, 'page')

    if (slug && parseUrlOnHosts(movie, flashWidgetHosts)?.pathname === '/Widgetflex.swf') {
      replaceWithWidget(element, slug)
    }
  }

  // The loader wrote `src` from the `id`, so a frame that already has one keeps it.
  for (const element of document.querySelectorAll('iframe.gfm-media-widget[id]:not([src])')) {
    const slug = attr(element, 'id')

    if (slug) {
      replaceWithWidget(element, slug)
    }
  }
}
