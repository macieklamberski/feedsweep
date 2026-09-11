import { composeCastImageUrl, composeCastUrl, extractCastId } from '../../embeds/asciinema.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createLinkedImage } from '../../utils/widgets.js'

// asciinema's embed is a `<script src="asciinema.org/a/{id}.js">` that draws the player client
// side, so the pipeline drops it and the recording with it. The static SVG render stands in.
export const convertAsciinemaEmbeds: DomTransform = () => (document) => {
  for (const script of document.querySelectorAll('script[src*="asciinema.org/a/"]')) {
    const castId = extractCastId(attr(script, 'src'))

    if (!castId) {
      continue
    }

    // A publisher's own <noscript> fallback names the same render, which would show twice.
    const fallback = script.nextElementSibling

    if (fallback?.localName === 'noscript' && fallback.innerHTML.includes(castId)) {
      fallback.remove()
    }

    script.replaceWith(
      createLinkedImage(document, {
        src: composeCastImageUrl(castId),
        href: composeCastUrl(castId),
      }),
    )
  }
}
