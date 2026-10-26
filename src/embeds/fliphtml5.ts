import { getPathSegments } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { isFileName, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fliphtml5'

// The viewer lives on this host alone. The apex serves the author's shelf at `homepage/{account}`,
// the same two-segment shape.
const fliphtml5Hosts = ['online.fliphtml5.com']

const sizes = { player: { ratio: '4/3' } }

// FlipHTML5's flipbook viewer, `online.fliphtml5.com/{account}/{book}/`, opening at the `#p=` page.
export const fliphtml5ResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegments(url)
  const [account, book] = segments

  // The viewer host serves files under an account, so a file name is an enclosure.
  if (segments.length !== 2 || !account || !book || isFileName(book)) {
    return
  }

  const viewerUrl = `https://online.fliphtml5.com/${account}/${book}/`
  const { p: page } = pickQueryParams(url.hash.slice(1), ['p'])

  return {
    provider,
    id: `${account}/${book}`,
    src: page ? `${viewerUrl}#p=${page}` : viewerUrl,
    url: viewerUrl,
    // The cover the viewer's own `og:image` names, 404 on a book that does not exist.
    thumbnail: `${viewerUrl}files/shot.jpg`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const fliphtml5IframeEmbedResolver = createUrlEmbedResolver(
  fliphtml5Hosts,
  fliphtml5ResolveEmbed,
)

// The LightBox snippet: a cover `<img>` that its script turns into a link, opening the book named
// in `data-href`. Without the script, only the cover renders.
export const fliphtml5LightBoxEmbedResolver = createMarkupEmbedResolver(
  'img[data-rel="fh5-light-box-demo"][data-href]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'data-href'), fliphtml5Hosts)

    if (!url) {
      return
    }

    return fliphtml5ResolveEmbed(url)
  },
)
