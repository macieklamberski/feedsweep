import type { DomTransform } from '../../types.js'
import { createLink } from '../../utils/widgets.js'

const gistScriptRegex = /gist\.github\.com\/(?:([^/?"]+)\/)?([^/?"#]+)\.js/

const gistCarrierSelector = 'script[src*="gist.github.com"], amp-gist[data-gistid]'

const readGistPath = (element: Element): string | undefined => {
  // <amp-gist> names the gist by id alone, with no owner. `gist.github.com/{id}` redirects to
  // the owned URL, so the bare id makes the same link the script form does.
  if (element.localName === 'amp-gist') {
    return element.getAttribute('data-gistid') || undefined
  }

  const match = element.getAttribute('src')?.match(gistScriptRegex)

  if (!match) {
    return
  }

  return match[1] ? `${match[1]}/${match[2]}` : match[2]
}

// A Gist embeds as a gist.github.com <script> or an <amp-gist>, and renders nothing without JS.
// An <amp-gist> names the id alone, and gist.github.com/{id} redirects to the owned url.
export const linkifyGistEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll(gistCarrierSelector)) {
    const path = readGistPath(element)

    if (!path) {
      continue
    }

    const url = `https://gist.github.com/${path}`

    element.replaceWith(createLink(document, url))
  }
}
