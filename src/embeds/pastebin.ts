import { encodePathSegment, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'pastebin'

const sizes = {
  player: { height: 150 },
}

const pastebinHosts = ['pastebin.com']

// Both carriers in both generations. The `.php?i={id}` spelling answers 404 for every id,
// including one whose paste is alive on the path form, so the two share an id space.
const embedRoutes = ['embed_iframe', 'embed_js', 'embed_iframe.php', 'embed_js.php']

const readPasteId = (url: URL): string | undefined => {
  const [route, pasteId, ...rest] = getPathSegments(url)

  if (!route || !isAnyOf(route, embedRoutes) || rest.length) {
    return
  }

  if (pasteId) {
    return pasteId
  }

  const queryId = getQueryParam(url.searchParams, 'i')

  if (!queryId) {
    return
  }

  // The query id comes out decoded, and it goes into a path beside the raw path spelling.
  return encodePathSegment(queryId)
}

export const pastebinResolveEmbed: ResolveUrlEmbed = (url) => {
  const pasteId = readPasteId(url)

  if (!pasteId) {
    return
  }

  return {
    provider,
    id: pasteId,
    src: `https://pastebin.com/embed_iframe/${pasteId}`,
    url: `https://pastebin.com/${pasteId}`,
    ...sizes.player,
  }
}

// Pastebin's paste frame, on the path form or the retired `.php?i={id}` one.
export const pastebinIframeEmbedResolver = createUrlEmbedResolver(
  pastebinHosts,
  pastebinResolveEmbed,
)

// The same paste as a script that writes its markup inline, which a reader never runs.
export const pastebinScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="pastebin.com/embed_js" i]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'src'), pastebinHosts)

    if (!url) {
      return
    }

    return pastebinResolveEmbed(url)
  },
)
