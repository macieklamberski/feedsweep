import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pastebin'

const pastebinHosts = ['pastebin.com']

const safePasteIdRegex = /^[a-zA-Z0-9]+$/

// The snippet's dark variant, a publisher layout choice the frame honours.
const pastebinEmbedParams = ['theme']

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

export const pastebinResolveEmbed: ResolveEmbed = (url) => {
  const pasteId = readPasteId(url)

  if (!pasteId || !safePasteIdRegex.test(pasteId)) {
    return
  }

  return {
    provider,
    id: pasteId,
    src: `https://pastebin.com/embed_iframe/${pasteId}${pickUrlParams(url, pastebinEmbedParams)}`,
    url: `https://pastebin.com/${pasteId}`,
  }
}

// Pastebin's paste frame, on the path form or the retired `.php?i={id}` one.
export const pastebinIframeEmbedResolver = createUrlEmbedResolver(
  pastebinHosts,
  pastebinResolveEmbed,
)

// The same paste as a script that writes its markup inline, which a reader never runs.
export const pastebinScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="pastebin.com/embed_js"]',
  (element) => {
    return pastebinResolveEmbed(attr(element, 'src') ?? '')
  },
)
