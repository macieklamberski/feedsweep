import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'anyflip'

const viewerHost = 'online.anyflip.com'
// The viewer's S3 bucket, which also serves it path-style with the bucket as the first segment.
const bucketHost = 's3.amazonaws.com'

// The routes under `{user}/{book}` that open the viewer. `index.html` is a script that sends the
// browser on to `mobile/index.html`.
const viewerPaths = ['', 'index.html', 'mobile/index.html']

// AnyFlip's flipbook viewer, `online.anyflip.com/{user}/{book}/index.html`, opening at the `#p=`
// page.
export const anyflipResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, [viewerHost, bucketHost])

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)
  const bucket = parsed.hostname === bucketHost ? segments.shift() : parsed.hostname
  const [user, book, ...rest] = segments

  if (bucket !== viewerHost || !book || !viewerPaths.includes(rest.join('/'))) {
    return
  }

  const viewerUrl = `https://online.anyflip.com/${user}/${book}/`
  const { p: page } = pickQueryParams(parsed.hash.slice(1), ['p'])

  return {
    provider,
    id: `${user}/${book}`,
    src: page ? `${viewerUrl}index.html#p=${page}` : `${viewerUrl}index.html`,
    url: `https://anyflip.com/${user}/${book}`,
    // The cover the viewer's own `og:image` names, 403 on a book that does not exist.
    thumbnail: `${viewerUrl}files/shot.jpg`,
    ratio: '550/350',
    title: attr(element, 'title'),
  }
}

export const anyflipEmbedResolver = createUrlEmbedResolver(
  [viewerHost, bucketHost],
  anyflipResolveEmbed,
)
