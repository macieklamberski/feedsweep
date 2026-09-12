import type { DomTransform } from '../../types.js'
import { attr, isEmptyElement } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

// GoFundMe's share sheet stamps these on the snippet it hands a supporter.
const shareParams = ['sharesheet', 'attribution_id']

// GoFundMe's campaign widget: an empty div carrying the campaign url in `data-url`, which only
// its sibling loader script turns into an iframe.
export const rebuildGofundmeEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('div.gfm-embed[data-url]')) {
    // A div that already holds the hydrated player or a donation link keeps what it carries.
    if (!isEmptyElement(element)) {
      continue
    }

    // `gfm` also abbreviates GitHub Flavored Markdown, so the class alone does not name GoFundMe.
    const url = parseUrlOnHosts(attr(element, 'data-url'), 'gofundme.com')

    if (!url) {
      continue
    }

    for (const name of shareParams) {
      url.searchParams.delete(name)
    }

    element.replaceWith(createIframe(document, url.toString()))
  }
}
