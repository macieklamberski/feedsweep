import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, isElement, isWhitespaceText, text } from '../utils/dom.js'
import { lettersRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'yumpu'

const sizes = {
  document: { ratio: '4/3' },
}

// `players.yumpu.com` serves the resizer script and `assets.yumpu.com` the site assets, so only
// the bare host and its `www.` spelling name a document.
const yumpuHosts = ['yumpu.com', 'www.yumpu.com']

const documentPathRegex = /^\/[a-z]+\/document\/view\/\d+(?:\/|$)/i

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
  const page = parseUrlOnHosts(href, yumpuHosts, isHostOf)

  if (!page || !documentPathRegex.test(page.pathname)) {
    return
  }

  anchor?.remove()

  return { url: href, title: attr(anchor, 'title') ?? text(anchor) }
}

// The player, `embed/view/{hash}`, and the older `document/embed/{hash}`, which YUMPU redirects
// onto it.
const readHash = (segments: Array<string>): string | undefined => {
  const [route, kind, hash] = segments

  if (isAnyOf(route, 'embed') && isAnyOf(kind, 'view')) {
    return hash
  }

  if (isAnyOf(route, 'document') && isAnyOf(kind, 'embed')) {
    return hash
  }
}

const yumpuResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const segments = getPathSegments(url)
  const isLocaleless = isAnyOf(segments[0], 'embed')
  const hash = readHash(isLocaleless ? segments : segments.slice(1))

  if (!isLocaleless && !lettersRegex.test(segments[0] ?? '')) {
    return
  }

  if (!hash) {
    return
  }

  // Every locale prefix serves the same document, and YUMPU redirects a path with none to `/en/`.
  return {
    provider,
    id: hash,
    src: `https://www.yumpu.com/en/embed/view/${hash}`,
    ...sizes.document,
    ...readCompanion(element),
  }
}

// YUMPU's flipbook iframe, which names a document by an opaque embed hash. The document page sits
// in a numeric id space that only the embed page's own canonical link joins to that hash.
export const yumpuEmbedResolver = createUrlEmbedResolver(yumpuHosts, yumpuResolveEmbed, {
  isOnHost: isHostOf,
})
