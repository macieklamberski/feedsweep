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

// Borlabs Cookie unblocks with `b64DecodeToUnicode`, which reads the base64 bytes as UTF-8.
const decodeBase64 = (value: string): string | undefined => {
  try {
    const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {}
}

const parkedCarriers = [
  // A lazy loader's load-later div, which holds the embed percent-encoded and renders nothing
  // itself.
  { selector: 'div.load-later[data-content]', attribute: 'data-content', decode: decodeSegment },

  // Borlabs Cookie's content blocker, which shows a consent notice in place of the embed and
  // holds the embed base64-encoded.
  {
    selector: '[data-borlabs-cookie-content]',
    attribute: 'data-borlabs-cookie-content',
    decode: decodeBase64,
  },
]

// A container that holds an embed encoded in an attribute and renders something else, or nothing.
export const surfaceParkedMarkup: DomTransform = () => (document) => {
  for (const { selector, attribute, decode } of parkedCarriers) {
    for (const container of document.querySelectorAll(selector)) {
      // The payload is the complete original element: the YouTube iframe or the tweet blockquote.
      const encoded = container.getAttribute(attribute)

      if (!encoded) {
        continue
      }

      const markup = decode(encoded)

      if (markup === undefined) {
        continue
      }

      const holder = document.createElement('div')
      // The decoded string still carries HTML entities in its attribute values.
      holder.innerHTML = markup

      // A load-later container states the embed's address as well as its markup. When the parked
      // element was itself stripped of every link, that address is the only thing left to reach the
      // post by.
      const url = container.getAttribute('data-url')

      if (url && isUrlShaped(url) && !hasStatedUrl(holder)) {
        holder.appendChild(createLink(document, url))
      }

      container.replaceWith(...Array.from(holder.childNodes))
    }
  }
}
