import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr, parsePixelSize } from '../utils/dom.js'
import { parseUrlOnHosts, urlSafeTokenRegex } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fliphtml5'

// The viewer lives on this host alone. The apex serves the author's shelf at `homepage/{account}`,
// the same two-segment shape.
const fliphtml5Hosts = ['online.fliphtml5.com']

// FlipHTML5's flipbook viewer, `online.fliphtml5.com/{account}/{book}/`. No query parameter the
// viewer reads is known, so the query is dropped with any tracker in it. The fragment stays: it
// holds the `#p=` start page and the `#?secret=` WordPress stamps on an untrusted oEmbed frame.
export const fliphtml5ResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, fliphtml5Hosts)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const [account, book] = segments

  if (segments.length !== 2 || !account || !book) {
    return
  }

  if (!urlSafeTokenRegex.test(account) || !urlSafeTokenRegex.test(book)) {
    return
  }

  return {
    provider,
    id: `${account}/${book}`,
    src: `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.hash}`,
    url: `https://online.fliphtml5.com/${account}/${book}/`,
    // The cover the viewer's own `og:image` names, 404 on a book that does not exist.
    thumbnail: `https://online.fliphtml5.com/${account}/${book}/files/shot.jpg`,
  }
}

export const fliphtml5IframeEmbedResolver = createUrlEmbedResolver(
  fliphtml5Hosts,
  fliphtml5ResolveEmbed,
)

// The LightBox snippet: a cover `<img>` that its script turns into a link, opening the book named
// in `data-href` in a frame sized by `data-width` and `data-height`. Without the script, only the
// cover renders.
export const fliphtml5LightBoxEmbedResolver = createMarkupEmbedResolver(
  'img[data-rel="fh5-light-box-demo"][data-href]',
  (element) => {
    const href = attr(element, 'data-href')

    if (!href) {
      return
    }

    const result = fliphtml5ResolveEmbed(href)

    if (!result) {
      return
    }

    // The script opens an 800 by 600 frame for a missing or unreadable half.
    return {
      ...result,
      width: parsePixelSize(attr(element, 'data-width')) ?? 800,
      height: parsePixelSize(attr(element, 'data-height')) ?? 600,
    }
  },
  { preferResolverSize: true },
)
