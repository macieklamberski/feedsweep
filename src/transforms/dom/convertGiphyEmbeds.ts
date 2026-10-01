import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { parseUrlOnHosts } from '../../utils/urls.js'
import { createLinkedImage } from '../../utils/widgets.js'

// `giphy.com/embed/{id}`, the media host spelling `media.giphy.com/media/{id}/giphy.gif` that
// some feeds put in an iframe instead, and the `giphy.com/gifs/{slug}-{id}` page url.
const giphyPathRegex = /^\/(?:embed|media|gifs)\/([^/]+)/

// A Giphy gif shipped as an iframe, a third-party frame around a file that animates in an <img>.
export const convertGiphyEmbeds: DomTransform = () => (document) => {
  for (const iframe of document.querySelectorAll('iframe[src*="giphy.com/"]')) {
    const segment = parseUrlOnHosts(attr(iframe, 'src'), 'giphy.com')?.pathname.match(
      giphyPathRegex,
    )?.[1]

    // The page url leads with a title slug, and the id itself carries no `-`.
    const gifId = segment?.split('-').at(-1)

    if (!gifId) {
      continue
    }

    // Giphy serves every gif at media.giphy.com/media/{id}/giphy.gif, derivable from the id
    // alone, and an invented id answers 404.
    const image = createLinkedImage(document, {
      src: `https://media.giphy.com/media/${gifId}/giphy.gif`,
      href: `https://giphy.com/gifs/${gifId}`,
      alt: attr(iframe, 'title'),
    })

    iframe.replaceWith(image)
  }
}
