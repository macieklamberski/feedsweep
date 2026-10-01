import {
  composeCastImageUrl,
  composeCastUrl,
  extractLoaderCastId,
  extractPageCastId,
  extractRenderCastId,
} from '../../embeds/asciinema.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createLinkedImage } from '../../utils/widgets.js'

// Publishers pair the loader with their own copy of the render, in a <noscript> or a bare link,
// on either side of it, and that copy would show twice.
const findFallback = (script: Element, castId: string) => {
  for (const sibling of [script.previousElementSibling, script.nextElementSibling]) {
    if (!sibling?.matches('noscript, a')) {
      continue
    }

    const image = sibling.querySelector('img[src]')

    if (extractRenderCastId(attr(image, 'src')) !== castId) {
      continue
    }

    // A caption or a link elsewhere is the publisher's own content, which the render lacks.
    if (sibling.textContent?.trim()) {
      continue
    }

    const anchors = sibling.matches('a') ? [sibling] : Array.from(sibling.querySelectorAll('a'))

    if (anchors.every((anchor) => extractPageCastId(attr(anchor, 'href')) === castId)) {
      return { sibling, image }
    }
  }
}

// asciinema's embed is a `<script src="asciinema.org/a/{id}.js">` that draws the player client
// side. The cast's static SVG render stands in.
export const convertAsciinemaEmbeds: DomTransform = () => (document) => {
  for (const script of document.querySelectorAll('script[src*="asciinema.org/a/"]')) {
    const castId = extractLoaderCastId(attr(script, 'src'))

    if (!castId) {
      continue
    }

    const fallback = findFallback(script, castId)
    const image = createLinkedImage(document, {
      src: composeCastImageUrl(castId),
      href: composeCastUrl(castId),
      alt: attr(fallback?.image, 'alt'),
    })

    fallback?.sibling.remove()
    script.replaceWith(image)
  }
}
