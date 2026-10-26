import { encodePathSegment, getQueryParam } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fc2'
const videoHosts = ['video.fc2.com']

const sizes = {
  // The loader draws the player 9/16 of its width tall.
  player: { ratio: '16/9' },
}

// The content page is `/content/{id}/`, behind a two-character language on most snippets. The
// adult site's `/a/content/` is refused, since the embed player cannot play it.
const contentPageRegex = /^\/(?:[A-Za-z0-9_]{2}\/)?content\/([^/]+)\/?$/i
const embedPlayerRegex = /^\/embed\/player\/([^/]+)\/?$/i
const flashPlayerRegex = /^\/flv2\.swf$/i

// `/embed/player/{id}/` is the route `outerplayer.min.js` composes. The content page is not a
// frame target.
const composeEmbed = (contentId: string): EmbedResolverResult => {
  return {
    provider,
    id: contentId,
    src: `https://video.fc2.com/embed/player/${contentId}/`,
    url: `https://video.fc2.com/content/${contentId}/`,
    ...sizes.player,
  }
}

const fc2IframeResolveEmbed: ResolveUrlEmbed = (url) => {
  const contentId = url.pathname.match(embedPlayerRegex)?.[1]

  if (!contentId) {
    return
  }

  return composeEmbed(contentId)
}

const fc2FlashResolveEmbed: ResolveUrlEmbed = (url) => {
  if (!flashPlayerRegex.test(url.pathname)) {
    return
  }

  const videoId = getQueryParam(url.searchParams, 'i')

  if (!videoId) {
    return
  }

  // The id comes out of the query decoded, and it goes into a path.
  const contentId = encodePathSegment(videoId)

  const duration = Number(getQueryParam(url.searchParams, 'd'))

  return {
    ...composeEmbed(contentId),
    title: getQueryParam(url.searchParams, 'tl'),
    duration: duration > 0 ? duration : undefined,
  }
}

// FC2 Video's player loader, which writes the player client side and leaves nothing behind.
export const fc2PlayerScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="static.fc2.com/video/js/outerplayer" i]',
  (element) => {
    if (!parseUrlOnHosts(attr(element, 'src'), 'static.fc2.com')) {
      return
    }

    // The loader plays `data-id` whenever it is present, whatever `url` names.
    const page = parseUrlOnHosts(attr(element, 'url'), videoHosts)?.pathname.match(contentPageRegex)
    const declaredId = attr(element, 'data-id')
    // The attribute comes out decoded, and it goes into a path beside the raw path spelling.
    const contentId = declaredId ? encodePathSegment(declaredId) : page?.[1]

    if (!contentId) {
      return
    }

    // The loader states the length in whole seconds.
    const duration = Number(attr(element, 'd'))

    return {
      ...composeEmbed(contentId),
      title: attr(element, 'tl'),
      duration: duration > 0 ? duration : undefined,
    }
  },
)

// FC2's blog-side shim, which document.writes the loader above and states the id on its own url.
export const fc2BlogScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="admin.blog.fc2.com/fc2video2.php" i]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), 'admin.blog.fc2.com')
    const videoId = getQueryParam(loader?.searchParams, 'id')

    if (!loader || !videoId) {
      return
    }

    // The id comes out of the query decoded, and it goes into a path.
    const contentId = encodePathSegment(videoId)

    return composeEmbed(contentId)
  },
)

// FC2 Video's embed player, as a publisher pasted it or as the loader writes it.
export const fc2IframeEmbedResolver = createUrlEmbedResolver(videoHosts, fc2IframeResolveEmbed)

// FC2 Video's retired Flash player, dead since Flash, naming the video in its `i` parameter.
export const fc2FlashEmbedResolver = createUrlEmbedResolver(videoHosts, fc2FlashResolveEmbed)
