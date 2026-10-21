import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, isElement, isWhitespaceText, keepIfMatches, text } from '../utils/dom.js'
import { localeWordRegex, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'yumpu'

// `players.yumpu.com` serves the resizer script and `assets.yumpu.com` the site assets, so only
// the bare host and its `www.` spelling name a document.
const yumpuHosts = ['yumpu.com', 'www.yumpu.com']

const documentPathRegex = /^\/[a-z]{2}\/document\/view\/\d+(?:\/|$)/

// The snippet can ship an empty anchor right after the iframe, naming the document page and its
// title. The page sits in a numeric id space the embed hash does not join to offline, so the
// anchor is the only source of either. Only whitespace may separate the two, so a link in the
// prose that follows stays a link.
const readCompanion = (element: Element | undefined): Partial<EmbedResolverResult> | undefined => {
  let node = element?.nextSibling

  while (node && isWhitespaceText(node)) {
    node = node.nextSibling
  }

  const anchor = isElement(node) ? node : undefined
  const href = attr(anchor, 'href')
  const page = parseUrl(href ?? '', placeholderBaseUrl)

  if (!page || !isHostOf(page, yumpuHosts) || !documentPathRegex.test(page.pathname)) {
    return
  }

  anchor?.remove()

  return { url: href, title: attr(anchor, 'title') ?? text(anchor) }
}

// The player, `embed/view/{hash}`, and the older `document/embed/{hash}`, which YUMPU redirects
// onto it.
const readHash = (segments: Array<string>): string | undefined => {
  const [route, kind, hash] = segments

  if (route === 'embed' && kind === 'view') {
    return hash
  }

  if (route === 'document' && kind === 'embed') {
    return hash
  }
}

const yumpuResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)

  if (!parsed || !isHostOf(parsed, yumpuHosts)) {
    return
  }

  const segments = getPathSegments(parsed)
  const isLocaleless = segments[0] === 'embed'
  // YUMPU redirects an embed path with no locale prefix to `/en/`.
  const locale = isLocaleless ? 'en' : keepIfMatches(segments[0], localeWordRegex)
  const hash = readHash(isLocaleless ? segments : segments.slice(1))

  if (!locale || !hash) {
    return
  }

  return {
    provider,
    id: hash,
    src: `https://www.yumpu.com/${locale}/embed/view/${hash}`,
    ratio: '4/3',
    ...readCompanion(element),
  }
}

// YUMPU's flipbook iframe, which names a document by an opaque embed hash. The document page sits
// in a numeric id space that only the embed page's own canonical link joins to that hash.
export const yumpuEmbedResolver = createUrlEmbedResolver(yumpuHosts, yumpuResolveEmbed)
