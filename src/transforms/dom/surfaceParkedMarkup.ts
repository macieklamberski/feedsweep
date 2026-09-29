import { decodeSegment } from 'trousse'
import type { DomTransform } from '../../types.js'
import { isUrlShaped } from '../../utils/urls.js'
import { createLink } from '../../utils/widgets.js'

// Matching a relative path too would take `class` and `style` values for addresses.
const statedUrlRegex = /^(?:https?:)?\/\//i

// Which attribute carries the embed's address differs per platform.
const hasStatedUrl = (holder: Element): boolean => {
  for (const element of holder.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      if (statedUrlRegex.test(attribute.value)) {
        return true
      }
    }
  }

  return false
}

// A lazy loader's load-later div, which holds the embed percent-encoded and renders nothing itself.
export const surfaceParkedMarkup: DomTransform = () => (document) => {
  for (const container of document.querySelectorAll('div.load-later[data-content]')) {
    // `data-content` is the complete original element: the YouTube iframe or the tweet blockquote.
    const encoded = container.getAttribute('data-content')

    if (!encoded) {
      continue
    }

    const markup = decodeSegment(encoded)

    if (markup === undefined) {
      continue
    }

    const holder = document.createElement('div')
    // The decoded string still carries HTML entities in its attribute values.
    holder.innerHTML = markup

    // The container states the embed's address as well as its markup. When the parked element was
    // itself stripped of every link, that address is the only thing left to reach the post by.
    const url = container.getAttribute('data-url')

    if (url && isUrlShaped(url) && !hasStatedUrl(holder)) {
      holder.appendChild(createLink(document, url))
    }

    container.replaceWith(...Array.from(holder.childNodes))
  }
}
