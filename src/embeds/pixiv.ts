import type { EmbedResolverResult } from '../types.js'
import { attr, text } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const pixivHosts = ['pixiv.net']

// A work id is the illustration's number and an upload hash, which the endpoint takes together.
const safeWorkIdRegex = /^(\d+)(?:_[0-9a-f]+)?$/

// The loader's own sizes: the frame is fixed per `data-size`, and a border adds 30 to the width.
const frameSizes = new Map([
  ['small', { width: 190, height: 250 }],
  ['medium', { width: 360, height: 300 }],
  ['large', { width: 670, height: 550 }],
])
const borderWidth = 30

// pixiv's illustration embed: a loader script naming the work in `data-id` and the box in
// `data-size`, with a <noscript> beside it naming the title and the author. The loader writes a
// frame onto `embed.pixiv.net/embed_mk2.php`, which answers a real work with the illustration
// and a removed or fabricated one with an error code.
export const pixivScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="source.pixiv.net/source/embed.js"][data-id]',
  (element) => {
    const workId = attr(element, 'data-id') ?? ''
    const illustId = workId.match(safeWorkIdRegex)?.[1]
    const size = attr(element, 'data-size') ?? 'small'
    const frame = frameSizes.get(size)

    if (!illustId || !frame) {
      return
    }

    const border = attr(element, 'data-border') === 'on'
    const fallback = element.nextElementSibling
    // The credits are pixiv's own anchors, the work and then its artist. Anything else beside
    // the loader is another publisher's markup and is neither read nor removed.
    const anchors =
      fallback?.localName === 'noscript' ? Array.from(fallback.querySelectorAll('a[href]')) : []
    const credits = anchors.every((anchor) => parseUrlOnHosts(attr(anchor, 'href'), pixivHosts))
      ? anchors
      : []
    const result: EmbedResolverResult = {
      provider: 'pixiv',
      id: workId,
      src: `https://embed.pixiv.net/embed_mk2.php?id=${workId}&size=${size}&border=${border ? 'on' : 'off'}`,
      url: `https://www.pixiv.net/artworks/${illustId}`,
      width: frame.width + (border ? borderWidth : 0),
      height: frame.height,
      title: text(credits[0]),
      author: text(credits[1]),
    }

    // The credits name the same work and would show as a second caption under the frame.
    if (credits.length) {
      fallback?.remove()
    }

    return result
  },
)
