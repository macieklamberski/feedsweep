import { getPathSegments } from 'trousse'
import type { EmbedResolverResult } from '../types.js'
import { attr, parsePixelSize } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const provider = 'fc2'

// A content id is a date and letters, bounded only by its alphabet, since a shape read off
// today's ids would refuse the next generation of them.
const safeContentIdRegex = /^[A-Za-z0-9]+$/

// The content page is `/content/{id}/`, with a language segment ahead of it on some snippets.
const readContentId = (url: string | undefined): string | undefined => {
  const parsed = parseUrlOnHosts(url, 'video.fc2.com')
  const segments = parsed ? getPathSegments(parsed) : []
  const route = segments.indexOf('content')

  return route >= 0 ? segments[route + 1] : undefined
}

// `/embed/player/{id}/` is the route `outerplayer.min.js` composes. The content page is not a
// frame target: it sends every real id to a login wall.
const composeEmbed = (contentId: string): EmbedResolverResult => {
  return {
    provider,
    id: contentId,
    src: `https://video.fc2.com/embed/player/${contentId}/`,
    url: `https://video.fc2.com/content/${contentId}/`,
  }
}

// FC2 Video's player loader, which writes the player client side and leaves nothing behind.
export const fc2PlayerScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="static.fc2.com/video/js/outerplayer"][url]',
  (element) => {
    if (!parseUrlOnHosts(attr(element, 'src'), 'static.fc2.com')) {
      return
    }

    const contentId = readContentId(attr(element, 'url'))

    if (!contentId || !safeContentIdRegex.test(contentId)) {
      return
    }

    // The loader states the length in whole seconds.
    const duration = Number(attr(element, 'd'))

    return {
      ...composeEmbed(contentId),
      width: parsePixelSize(attr(element, 'w')),
      height: parsePixelSize(attr(element, 'h')),
      title: attr(element, 'tl'),
      duration: duration > 0 ? duration : undefined,
    }
  },
)

// FC2's blog-side shim, which document.writes the loader above and so states nothing but the id.
// Today the video is replaced by the payment link its <noscript> holds.
export const fc2BlogScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="admin.blog.fc2.com/fc2video2.php"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), 'admin.blog.fc2.com')
    const contentId = loader?.searchParams.get('id')

    if (!contentId || !safeContentIdRegex.test(contentId)) {
      return
    }

    return composeEmbed(contentId)
  },
)
