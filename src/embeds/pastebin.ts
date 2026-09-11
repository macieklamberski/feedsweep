import { getPathSegments } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pastebin'

const pastebinHosts = ['pastebin.com']

const safePasteIdRegex = /^[a-zA-Z0-9]+$/

// Both carriers in both generations. The `.php?i={id}` spelling answers 404 for every id,
// including one whose paste is alive on the path form, so the two share an id space.
const embedRoutes = ['embed_iframe', 'embed_js', 'embed_iframe.php', 'embed_js.php']

const readPasteId = (url: string | undefined): string | undefined => {
  const parsed = parseUrlOnHosts(url, pastebinHosts)

  if (!parsed) {
    return
  }

  const [route, pasteId, ...rest] = getPathSegments(parsed)

  if (!route || !embedRoutes.includes(route) || rest.length) {
    return
  }

  return pasteId ?? parsed.searchParams.get('i') ?? undefined
}

const composeResult = (pasteId: string | undefined): EmbedResolverResult | undefined => {
  if (!pasteId || !safePasteIdRegex.test(pasteId)) {
    return
  }

  return {
    provider,
    id: pasteId,
    src: `https://pastebin.com/embed_iframe/${pasteId}`,
    url: `https://pastebin.com/${pasteId}`,
  }
}

export const pastebinResolveEmbed: ResolveEmbed = (url) => {
  return composeResult(readPasteId(url))
}

// Pastebin's paste frame, on the path form or the retired `.php?i={id}` one.
export const pastebinIframeEmbedResolver = createUrlEmbedResolver(
  pastebinHosts,
  pastebinResolveEmbed,
)

// The same paste carried as a script that writes the frame, which a reader never runs.
export const pastebinScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="pastebin.com/embed_js"]',
  (element) => {
    return composeResult(readPasteId(attr(element, 'src')))
  },
)
