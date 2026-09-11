import { parseUrl, trimObject } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches, parsePixelSize } from '../utils/dom.js'
import {
  composeQuery,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'fc2'
const videoHosts = ['video.fc2.com']

// A content id is a date and letters, bounded only by its alphabet, since a shape read off
// today's ids would refuse the next generation of them.
const safeContentIdRegex = /^[A-Za-z0-9]+$/

// The content page is `/content/{id}/`, behind a two-letter language on most snippets. The adult
// site's `/a/content/` is refused, since the embed player cannot play it.
const contentPageRegex = /^\/(?:([A-Za-z]{2})\/)?content\/([^/]+)\/?$/
const embedPlayerRegex = /^\/+embed\/player\/([^/]+)\/?$/i
const flashPlayerRegex = /^\/flv2\.swf$/

// The player reads `tg`, the embedding account's tag, and `sg=0`, which hides the suggestions
// on its end screen.
const playerParams = ['tg', 'sg']

type ContentPage = { contentId: string; locale?: string }

const readContentPage = (url: string | undefined): ContentPage | undefined => {
  const parsed = parseUrlOnHosts(url, videoHosts)
  const match = parsed?.pathname.match(contentPageRegex)
  const contentId = keepIfMatches(match?.[2], safeContentIdRegex)

  if (!contentId) {
    return
  }

  return { contentId, locale: match?.[1] }
}

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
  }
}

const fc2IframeResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const match = parsed?.pathname.match(embedPlayerRegex)
  const contentId = keepIfMatches(match?.[1], safeContentIdRegex)

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

  const contentId = keepIfMatches(parsed.searchParams.get('i'), safeContentIdRegex)

  if (!contentId) {
    return
  }

  // The Flash player names the same account tag `tk` as the loader does.
  const params = trimObject({ tg: parsed.searchParams.get('tk') }, Boolean)
  const duration = Number(parsed.searchParams.get('d'))

  return {
    ...composeEmbed({ contentId }, params),
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
    const dataId = attr(element, 'data-id')
    const page = readContentPage(attr(element, 'url'))
    const contentId = dataId ? keepIfMatches(dataId, safeContentIdRegex) : page?.contentId

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

    // The loader keeps a stated width above 192 and a height above 108. Otherwise it draws the
    // player 512 wide and 9/16 of the width tall.
    const statedWidth = parsePixelSize(attr(element, 'w')) ?? 0
    const statedHeight = parsePixelSize(attr(element, 'h')) ?? 0
    const width = statedWidth > 192 ? statedWidth : 512
    const height = statedHeight > 108 ? statedHeight : Math.floor((width * 9) / 16)

    // The loader states the length in whole seconds.
    const duration = Number(attr(element, 'd'))

    return {
      ...composeEmbed({ contentId, locale: page?.locale }, params),
      width,
      height,
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
    const contentId = keepIfMatches(loader?.searchParams.get('id'), safeContentIdRegex)

    if (!loader || !contentId) {
      return
    }

    // The shim writes `suggest="off"` on the loader unless `rel=1`, and a smaller box when `s`
    // is present with any value. The account tag it writes is not derivable from the url.
    const params = loader.searchParams.get('rel') === '1' ? undefined : { sg: '0' }
    const isSmall = loader.searchParams.has('s')

    return {
      ...composeEmbed({ contentId, locale: 'ja' }, params),
      width: isSmall ? 320 : 446,
      height: isSmall ? 273 : 380,
    }
  },
)

// FC2 Video's embed player, as a publisher pasted it or as the loader writes it.
export const fc2IframeEmbedResolver = createUrlEmbedResolver(videoHosts, fc2IframeResolveEmbed)

// FC2 Video's retired Flash player, dead since Flash, naming the video in its `i` parameter.
export const fc2FlashEmbedResolver = createUrlEmbedResolver(videoHosts, fc2FlashResolveEmbed)
