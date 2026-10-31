import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  trimObject,
} from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr, flashVars, parseFlashVars } from '../utils/dom.js'
import { isFileName, parseUrlOnHosts } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  readCleanedAttributeUrl,
} from '../utils/widgets.js'

const provider = 'issuu'

const hosts = ['issuu.com']

// `issuu.com/{publisher}/docs/{document}/s/{story}` names a story, not a page, in the page's
// position.
const storyRoute = 's'

// The Flash reader's route, `static.issuu.com/webembed/viewers/…/IssuuViewer.swf`.
const flashRoute = 'webembed'

// Only `embed.html` is minted: `anonymous-embed.html` answers 403 for every document.
const embedPaths = ['embed.html', 'anonymous-embed.html']

const sizes = {
  player: { ratio: '5/3' },
}

const composeConfigEmbed = (configId: string | undefined): EmbedResolverResult | undefined => {
  if (!configId) {
    return
  }

  return {
    provider,
    id: configId,
    src: `https://e.issuu.com/embed.html#${configId}`,
    ...sizes.player,
  }
}

// The page number stays out of the id, because it selects a view of one document while the id is
// what addresses the document itself. It stays in the url, which is what selects the page.
const composeDocumentEmbed = (
  publisher: string | undefined,
  documentName: string | undefined,
  page?: string,
): EmbedResolverResult | undefined => {
  if (!publisher || !documentName) {
    return
  }

  const query = composeQuery(trimObject({ u: publisher, d: documentName, p: page }))

  return {
    provider,
    id: `${publisher}/${documentName}`,
    src: `https://e.issuu.com/embed.html${query}`,
    // The iframe's `u` and `d` come out of the query decoded, and each goes into a path segment.
    url: `https://issuu.com/${encodePathSegment(publisher)}/docs/${encodePathSegment(documentName)}`,
    ...sizes.player,
  }
}

// A reader url, `issuu.com/{publisher}/docs/{document}` with an optional page number after it.
const readDocumentUrl = (parsed: URL | undefined): EmbedResolverResult | undefined => {
  if (!parsed) {
    return
  }

  const [publisher, marker, documentName, page] = getPathSegments(parsed)

  if (!isAnyOf(marker, 'docs') || !documentName || isFileName(documentName)) {
    return
  }

  // Decoded here, so the url and the reader encode them once.
  return composeDocumentEmbed(
    decodeSegment(publisher) ?? publisher,
    decodeSegment(documentName) ?? documentName,
    isAnyOf(page, storyRoute) ? undefined : page,
  )
}

// Issuu ships a document as an empty div only its `embed.js` loader hydrates into the reader.
// The loader reads `data-configid` into the hash of `e.issuu.com/embed.html`, and parses
// `data-url` into the `u`, `d` and `p` query.
export const issuuWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.issuuembed[data-configid], div.issuuembed[data-url]',
  (element, context) => {
    const configEmbed = composeConfigEmbed(attr(element, 'data-configid'))

    if (configEmbed) {
      return configEmbed
    }

    const declared = readCleanedAttributeUrl(element, 'data-url', context)

    return readDocumentUrl(parseUrlOnHosts(declared, hosts))
  },
)

// The Flash reader names its document by `username` and `docName`, spelled `documentUsername` and
// `documentName` by the older snippet, in the swf query or in flashvars, beside a `documentId`
// that is a third id space neither url form accepts.
const readFlashDocument = (parsed: URL, element?: Element): EmbedResolverResult | undefined => {
  const settings =
    getQueryParam(parsed.searchParams, 'docName') !== undefined
      ? parsed.searchParams
      : parseFlashVars(flashVars(element))
  const embed = composeDocumentEmbed(
    getQueryParam(settings, 'username') ?? getQueryParam(settings, 'documentUsername'),
    getQueryParam(settings, 'docName') ?? getQueryParam(settings, 'documentName'),
    getQueryParam(settings, 'pageNumber'),
  )

  if (!embed) {
    return
  }

  return {
    ...embed,
    title: getQueryParam(settings, 'loadingInfoText'),
  }
}

// The reader iframe, at `e.issuu.com/embed.html` or the document page pasted from the address bar,
// and the retired Flash reader.
const issuuResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const [route = ''] = getPathSegments(url)

  if (isAnyOf(route, flashRoute)) {
    return readFlashDocument(url, element)
  }

  // The share snippet writes the publication name on the iframe, which neither url form holds.
  const title = attr(element, 'title')

  if (!isAnyOf(route, embedPaths)) {
    const embed = readDocumentUrl(url)

    if (!embed) {
      return
    }

    return { ...embed, title }
  }

  // The two id spaces the carrier can name, in the order the reader states them: a config id
  // pair in the fragment, else the publisher and document names in the query.
  const embed =
    composeConfigEmbed(url.hash.replace('#', '')) ??
    composeDocumentEmbed(
      getQueryParam(url.searchParams, 'u'),
      getQueryParam(url.searchParams, 'd'),
      getQueryParam(url.searchParams, 'p'),
    )

  if (!embed) {
    return
  }

  return { ...embed, title }
}

export const issuuIframeEmbedResolver = createUrlEmbedResolver(hosts, issuuResolveEmbed)

export const issuuFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'issuu.com' },
]
