import { decodeSegment, getPathSegments, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { attr, flashVar } from '../utils/dom.js'
import {
  composeQuery,
  encodePathSegment,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// The embed routes are the site's own. `scribdassets.com` served the Flash player and serves the
// document images beside it, `img/document/{id}/…` among them, so only the Flash resolver takes
// it: read as an embed those images mint a player over a picture the feed attached.
const scribdHosts = ['scribd.com']
// scribdassets.com serves img/document/{id}/ images too, which would read here as documents.
const scribdFlashHosts = [...scribdHosts, 'scribdassets.com']

const documentIdMarkers = ['embeds', 'document', 'doc']

const flashPlayerPathRegex = /\/scribdviewer\.swf$/i

// A private document opens only with its `access_key`, and `start_page` is where reading starts.
const playerParams = ['access_key', 'start_page']

// The embeds route answers 200 with an identical body for any id, rendering "Document deleted by
// owner" for a Flash-era id and "Document Not Found" for an invented one.
const composeEmbed = (document: string, search = ''): EmbedResolverResult => {
  const params = pickQueryParams(search, playerParams)
  // The Flash `document_id` comes out of a query decoded, and it goes into a path.
  const segment = encodePathSegment(document)

  return {
    provider: 'scribd',
    id: document,
    src: `https://www.scribd.com/embeds/${segment}/content${composeQuery(params)}`,
    // The document page takes no key, so a private document gets no page url.
    url: params.access_key ? undefined : `https://www.scribd.com/document/${segment}`,
    height: 600,
  }
}

const readDocumentId = (parsed: URL): string | undefined => {
  const segments = getPathSegments(parsed)
  // Feeds carry the same routes under `/mobile`, the mobile site's prefix.
  const [marker, document] = segments[0] === 'mobile' ? segments.slice(1) : segments

  if (!marker || !documentIdMarkers.includes(marker) || !document) {
    return
  }

  // Decoded here, like the Flash `document_id`, so the player url encodes it once.
  return decodeSegment(document) ?? document
}

// The modern player, `scribd.com/embeds/{id}/content`. `/doc/{id}` is the pre-2018 spelling of
// the same document and its embed lived at `/embeds/{id}` with no `/content` suffix. Both
// address the id space this composes from.
export const scribdResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrlOnHosts(url, scribdHosts)

  if (!parsed) {
    return
  }

  const document = readDocumentId(parsed)

  if (!document) {
    return
  }

  return { ...composeEmbed(document, parsed.search), title: attr(element, 'title') }
}

// Scribd's player iframe, /embeds/{id}/content.
export const scribdIframeEmbedResolver = createUrlEmbedResolver(scribdHosts, scribdResolveEmbed, {
  preferResolverSize: true,
})

export const scribdFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !flashPlayerPathRegex.test(parsed.pathname)) {
    return
  }

  const document = parsed.searchParams.get('document_id') ?? flashVar(element, 'document_id')

  if (!document) {
    return
  }

  return composeEmbed(document)
}

// Scribd's Flash viewer, scribdviewer.swf, dead since 2020 and naming its document in document_id.
export const scribdFlashEmbedResolver = createUrlEmbedResolver(
  scribdFlashHosts,
  scribdFlashResolveEmbed,
)
