import { parseUrl } from 'trousse'
import type { DomTransform } from '../../types.js'

const urlAttributes = ['src', 'href', 'data', 'poster']
const selector = urlAttributes.map((name) => `[${name}]`).join(', ')

// A protocol-relative url concatenated onto the site origin, so the path opens with two or three
// slashes, the host the author wrote and a path of its own. A doubled slash before a file such as
// index.php reads as a host too, so a file extension is refused as a top-level domain.
const concatenatedPathRegex =
  /^\/{2,}([a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?!(?:php|html?|aspx?|jsp|cgi)\/)[a-z]{2,})(\/.*)$/i

// An iframe src carrying the site origin concatenated onto a protocol-relative url loads the
// publisher's own home page at 200, so nothing downstream can tell it is wrong.
export const fixConcatenatedUrls: DomTransform = () => {
  return (document) => {
    for (const element of document.querySelectorAll(selector)) {
      for (const name of urlAttributes) {
        const url = parseUrl(element.getAttribute(name) ?? '')
        const match = url?.pathname.match(concatenatedPathRegex)

        if (!url || !match) {
          continue
        }

        const repairedUrl = `${url.protocol}//${match[1]}${match[2]}${url.search}${url.hash}`

        element.setAttribute(name, repairedUrl)
      }
    }
  }
}
