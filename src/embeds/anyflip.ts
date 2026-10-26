import { composeQuery, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'anyflip'

const sizes = {
  player: { ratio: '550/350' },
}

const hosts = ['online.anyflip.com']
// The viewer's S3 bucket, which also serves it path-style with the bucket as the first segment.
const bucketHosts = ['s3.amazonaws.com']

// The routes under `{user}/{book}` that open the viewer. `index.html` is a script that sends the
// browser on to `mobile/index.html`.
const viewerPaths = ['', 'index.html', 'mobile/index.html']

// AnyFlip's flipbook viewer, `online.anyflip.com/{user}/{book}/index.html`, with the `#p=` start
// page the embed dialog writes.
export const anyflipResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegments(url)
  const bucket = isHostOf(url, bucketHosts) ? segments.shift() : url.hostname
  const [user, book, ...rest] = segments

  if (!isAnyOf(bucket, hosts) || !book || !isAnyOf(rest.join('/'), viewerPaths)) {
    return
  }

  const viewerUrl = `https://online.anyflip.com/${user}/${book}/`
  // The start page sits in the fragment, so its query is written after `#`.
  const hashQuery = url.hash.slice(1)
  const startPage = pickQueryParams(hashQuery, ['p'])
  const fragment = composeQuery(startPage).replace('?', '#')

  return {
    provider,
    id: `${user}/${book}`,
    src: `${viewerUrl}index.html${fragment}`,
    url: `https://anyflip.com/${user}/${book}`,
    // The cover the viewer's own `og:image` names, 403 on a book that does not exist.
    thumbnail: `${viewerUrl}files/shot.jpg`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const anyflipEmbedResolver = createUrlEmbedResolver(
  [...hosts, ...bucketHosts],
  anyflipResolveEmbed,
)
