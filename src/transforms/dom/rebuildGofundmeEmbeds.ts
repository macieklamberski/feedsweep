import { composeGofundmeWidgetUrl } from '../../embeds/gofundme.js'
import type { DomTransform } from '../../types.js'
import { attr, isEmptyElement } from '../../utils/dom.js'
import { createIframe } from '../../utils/widgets.js'

// The large widget's height in a wide frame, before the frame posts its own.
const widgetHeight = 560

// GoFundMe's campaign widget: an empty div carrying the campaign url in `data-url`, which only
// its sibling loader script turns into an iframe.
export const rebuildGofundmeEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('div.gfm-embed[data-url]')) {
    // A div that already holds the hydrated player or a donation link keeps what it carries.
    if (!isEmptyElement(element)) {
      continue
    }

    // `gfm` also abbreviates GitHub Flavored Markdown, so the class alone does not name GoFundMe.
    const src = composeGofundmeWidgetUrl(attr(element, 'data-url'))

    if (!src) {
      continue
    }

    const iframe = createIframe(document, src)

    iframe.setAttribute('height', String(widgetHeight))
    element.replaceWith(iframe)
  }
}
