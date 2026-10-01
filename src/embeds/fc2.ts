import { parseUrl, trimObject } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import {
  composeQuery,
  encodePathSegment,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fc2'
const videoHosts = ['video.fc2.com']

// The content page is `/content/{id}/`, behind a two-character language on most snippets. The
// adult site's `/a/content/` is refused, since the embed player cannot play it.
const contentPageRegex = /^\/(?:([A-Za-z0-9_]{2})\/)?content\/([^/]+)\/?$/
const embedPlayerRegex = /^\/+embed\/player\/([^/]+)\/?$/i
const flashPlayerRegex = /^\/flv2\.swf$/

// A shape, not a list: FC2 answers a language it does not serve with the Japanese page, so any two
// letters, digits or underscores still open the video.
const localeRegex = /^[A-Za-z0-9_]{2}$/

// The player reads `tg`, the embedding account's tag, and `sg=0`, which hides the suggestions
// on its end screen.
const playerParams = ['tg', 'sg']

type ContentPage = { contentId: string; locale?: string }

// `/embed/player/{id}/` is the route `outerplayer.min.js` composes. The content page is not a
// frame target.
const composeEmbed = (
  { contentId, locale }: ContentPage,
  params?: Record<string, string>,
): EmbedResolverResult => {
  return {
    provider,
    id: contentId,
    src: `https://video.fc2.com/embed/player/${contentId}/${composeQuery(params)}`,
    url: `https://video.fc2.com/${locale ? `${locale}/` : ''}content/${contentId}/`,
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

  return composeEmbed({ contentId }, pickQueryParams(parsed.search, playerParams))
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

  // The Flash player names the same account tag `tk` as the loader does.
  const params = trimObject({ tg: parsed.searchParams.get('tk') }, Boolean)
  const duration = Number(parsed.searchParams.get('d'))
  const locale = keepIfMatches(parsed.searchParams.get('lang'), localeRegex)

  return {
    ...composeEmbed({ contentId, locale }, params),
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

    // The loader plays `data-id` whenever it is present, whatever `url` names, and the language
    // still comes from `url`.
    const page = parseUrlOnHosts(attr(element, 'url'), videoHosts)?.pathname.match(contentPageRegex)
    const contentId = attr(element, 'data-id') ?? page?.[2]

    if (!contentId) {
      return
    }

    const params = trimObject(
      {
        tg: attr(element, 'tk'),
        sg: attr(element, 'suggest') === 'off' ? '0' : undefined,
      },
      Boolean,
    )

    // The loader states the length in whole seconds.
    const duration = Number(attr(element, 'd'))

    return {
      ...composeEmbed({ contentId, locale: page?.[1] }, params),
      title: attr(element, 'tl'),
      duration: duration > 0 ? duration : undefined,
    }
  },
)

// FC2's blog-side shim, which document.writes the loader above and states only the id and two
// flags on its own url.
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

    // The shim writes `suggest="off"` on the loader unless `rel=1`. The account tag it writes is
    // not derivable from the url.
    const params = loader.searchParams.get('rel') === '1' ? undefined : { sg: '0' }

    return composeEmbed({ contentId, locale: 'ja' }, params)
  },
)

// FC2 Video's embed player, as a publisher pasted it or as the loader writes it.
export const fc2IframeEmbedResolver = createUrlEmbedResolver(videoHosts, fc2IframeResolveEmbed)

// FC2 Video's retired Flash player, dead since Flash, naming the video in its `i` parameter.
export const fc2FlashEmbedResolver = createUrlEmbedResolver(videoHosts, fc2FlashResolveEmbed)
