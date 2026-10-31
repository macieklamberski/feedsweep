import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  getQueryParams,
  isAnyOf,
} from 'trousse'
import type { EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr, flashVar, flashVars } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'scribd'

const sizes = {
  document: { height: 600 },
}

// The embed routes are the site's own. `scribdassets.com` served the Flash player and serves the
// document images beside it, `img/document/{id}/…` among them, so only the Flash resolver takes
// it: read as an embed those images mint a player over a picture the feed attached.
const hosts = ['scribd.com']
// scribdassets.com serves img/document/{id}/ images too, which would read here as documents.
const flashHosts = [...hosts, 'scribdassets.com']

const documentIdMarkers = ['embeds', 'document', 'doc']

const flashPlayerPathRegex = /\/scribdviewer\.swf$/i

// A private document opens only with its `access_key`, and `start_page` is where reading starts.
const playerParams = ['access_key', 'start_page']

// The embeds route answers 200 with an identical body for any id, rendering "Document deleted by
// owner" for a Flash-era id and "Document Not Found" for an invented one.
const composeEmbed = (
  document: string,
  params: Record<string, string> = {},
): EmbedResolverResult => {
  // The Flash `document_id` comes out of a query decoded, and it goes into a path.
  const segment = encodePathSegment(document)

  return {
    provider,
    id: document,
    src: `https://www.scribd.com/embeds/${segment}/content${composeQuery(params)}`,
    // A public document's page opens without the key. A private one answers 410 with or without
    // it, and nothing offline tells the two apart.
    url: `https://www.scribd.com/document/${segment}`,
    ...sizes.document,
  }
}

const readDocumentId = (parsed: URL): string | undefined => {
  const segments = getPathSegments(parsed)
  // Feeds carry the same routes under `/mobile`, the mobile site's prefix.
  const [mobileOrMarker] = segments
  const [marker, document] = isAnyOf(mobileOrMarker, 'mobile') ? segments.slice(1) : segments

  if (!marker || !isAnyOf(marker, documentIdMarkers) || !document) {
    return
  }

  // Decoded here, like the Flash `document_id`, so the player url encodes it once.
  return decodeSegment(document) ?? document
}

// The modern player, `scribd.com/embeds/{id}/content`. `/doc/{id}` is the pre-2018 spelling of
// the same document and its embed lived at `/embeds/{id}` with no `/content` suffix. Both
// address the id space this composes from.
export const scribdResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const document = readDocumentId(url)

  if (!document) {
    return
  }

  const params = getQueryParams(url.search, playerParams)

  return { ...composeEmbed(document, params), title: attr(element, 'title') }
}

// Scribd's player iframe, /embeds/{id}/content.
export const scribdIframeEmbedResolver = createUrlEmbedResolver(hosts, scribdResolveEmbed)

export const scribdFlashResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (!flashPlayerPathRegex.test(url.pathname)) {
    return
  }

  const queryDocument = getQueryParam(url.searchParams, 'document_id')
  const document = queryDocument ?? flashVar(element, 'document_id')

  if (!document) {
    return
  }

  // The access key sits beside the document id, in the swf query or in the flashvars. The viewer
  // named the page it opened on `page`, which the player calls `start_page`.
  const search = queryDocument ? url.search : (flashVars(element) ?? '')
  const { page, ...params } = getQueryParams(search, ['access_key', 'page'])

  if (page) {
    params.start_page = page
  }

  return composeEmbed(document, params)
}

// Scribd's Flash viewer, scribdviewer.swf, dead since 2020 and naming its document in document_id.
export const scribdFlashEmbedResolver = createUrlEmbedResolver(flashHosts, scribdFlashResolveEmbed)
