import { isAnyOf } from 'trousse'
import type { DomTransform } from '../../types.js'
import { attr, isEmptyElement } from '../../utils/dom.js'
import { filterUrlQuery, parseUrlOnHosts } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

// GoFundMe's share sheet stamps these on the snippet it hands a supporter.
const shareParams = ['sharesheet', 'attribution_id']

// The share sheet's stamps and the campaign tags a share link picks up.
const isKeptParam = (name: string): boolean => {
  const lowercased = name.toLowerCase()

  return (
    !isAnyOf(lowercased, shareParams) && lowercased !== 'fbclid' && !lowercased.startsWith('utm_')
  )
}

// The loader's starting height per size segment, `/f/{slug}/widget/{size}`, before the frame posts
// its own. Any other segment, or none, starts at the large height.
const widgetHeights: Record<string, number> = { small: 70, medium: 200 }
const largeWidgetHeight = 500

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

    url.search = filterUrlQuery(url, isKeptParam)

    // The host redirects `http:` to `https:`, and an `http:` frame is blocked as mixed content.
    url.protocol = 'https:'

    const size = url.pathname.split('/')[4] ?? ''
    const height = Object.hasOwn(widgetHeights, size) ? widgetHeights[size] : largeWidgetHeight
    const iframe = createIframe(document, url.toString())

    iframe.setAttribute('height', String(height))
    element.replaceWith(iframe)
  }
}
