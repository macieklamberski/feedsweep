import { parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fc2'
const videoHosts = ['video.fc2.com']

// The content page is `/content/{id}/`, behind a two-character language on most snippets. The
// adult site's `/a/content/` is refused, since the embed player cannot play it.
const contentPageRegex = /^\/(?:[A-Za-z0-9_]{2}\/)?content\/([^/]+)\/?$/
const embedPlayerRegex = /^\/+embed\/player\/([^/]+)\/?$/i
const flashPlayerRegex = /^\/flv2\.swf$/

// `/embed/player/{id}/` is the route `outerplayer.min.js` composes. The content page is not a
// frame target.
const composeEmbed = (contentId: string): EmbedResolverResult => {
  return {
    provider,
    id: contentId,
    src: `https://video.fc2.com/embed/player/${contentId}/`,
    url: `https://video.fc2.com/content/${contentId}/`,
    // The loader draws the player 9/16 of its width tall.
    ratio: '16/9',
  }
}

const fc2IframeResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const contentId = parsed?.pathname.match(embedPlayerRegex)?.[1]

  if (!parsed || !contentId) {
    return
  }

  return composeEmbed(contentId)
}

const fc2FlashResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !flashPlayerRegex.test(parsed.pathname)) {
    return
  }

  const videoId = parsed.searchParams.get('i')

  if (!videoId) {
    return
  }

  // The id comes out of the query decoded, and it goes into a path.
  const contentId = encodePathSegment(videoId)

  const duration = Number(parsed.searchParams.get('d'))

  return {
    ...composeEmbed(contentId),
    title: parsed.searchParams.get('tl') ?? undefined,
    duration: duration > 0 ? duration : undefined,
  }
}

// FC2 Video's player loader, which writes the player client side and leaves nothing behind.
export const fc2PlayerScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="static.fc2.com/video/js/outerplayer"]',
  (element) => {
    if (!parseUrlOnHosts(attr(element, 'src'), 'static.fc2.com')) {
      return
    }

    // The loader plays `data-id` whenever it is present, whatever `url` names.
    const page = parseUrlOnHosts(attr(element, 'url'), videoHosts)?.pathname.match(contentPageRegex)
    const contentId = attr(element, 'data-id') ?? page?.[1]

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
  'script[src*="admin.blog.fc2.com/fc2video2.php"]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), 'admin.blog.fc2.com')
    const videoId = loader?.searchParams.get('id')

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
