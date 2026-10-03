import { decodeSegment, getPathSegments, isAnyOf, parseUrl, trimObject } from 'trousse'
import type { EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'

const provider = 'issuu'

import { attr, flashVars } from '../utils/dom.js'
import { composeQuery, encodePathSegment, isFileName, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const issuuHosts = ['issuu.com']

// `issuu.com/{publisher}/docs/{document}/s/{story}` names a story, not a page, in the page's
// position.
const storyRoute = 's'

// The Flash reader's route, `static.issuu.com/webembed/viewers/…/IssuuReader.swf`.
const flashRoute = 'webembed'

// Only `embed.html` is minted: `anonymous-embed.html` answers 403 for every document.
const embedPaths = ['embed.html', 'anonymous-embed.html']

const documentRatio = '5/3'

const composeConfigEmbed = (configId: string | undefined): EmbedResolverResult | undefined => {
  if (!configId) {
    return
  }

  return {
    provider,
    id: configId,
    src: `https://e.issuu.com/embed.html#${configId}`,
    ratio: documentRatio,
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
    ratio: documentRatio,
  }
}

// A reader url, `issuu.com/{publisher}/docs/{document}` with an optional page number after it.
const readDocumentUrl = (url: string): EmbedResolverResult | undefined => {
  const parsed = parseUrlOnHosts(url, issuuHosts)

  if (!parsed) {
    return
  }

  const [publisher, marker, documentName, page] = getPathSegments(parsed)

  if (marker !== 'docs' || !documentName || isFileName(documentName)) {
    return
  }

  // Decoded here, so the url and the reader encode them once.
  return composeDocumentEmbed(
    decodeSegment(publisher) ?? publisher,
    decodeSegment(documentName) ?? documentName,
    page === storyRoute ? undefined : page,
  )
}

// Issuu ships a document as an empty div only its `embed.js` loader hydrates into the reader.
// The loader reads `data-configid` into the hash of `e.issuu.com/embed.html`, and parses
// `data-url` into the `u`, `d` and `p` query.
export const issuuWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.issuuembed[data-configid], div.issuuembed[data-url]',
  (element) => {
    return (
      composeConfigEmbed(attr(element, 'data-configid')) ??
      readDocumentUrl(attr(element, 'data-url') ?? '')
    )
  },
)

// The Flash reader names its document by `username` and `docName`, in the swf query or in
// flashvars, beside a `documentId` that is a third id space neither url form accepts.
const readFlashDocument = (parsed: URL, element?: Element): EmbedResolverResult | undefined => {
  const settings = parsed.searchParams.has('docName')
    ? parsed.searchParams
    : new URLSearchParams(flashVars(element))
  const embed = composeDocumentEmbed(
    settings.get('username') ?? undefined,
    settings.get('docName') ?? undefined,
    settings.get('pageNumber') ?? undefined,
  )

  if (!embed) {
    return
  }

  return {
    ...embed,
    title: settings.get('loadingInfoText') ?? undefined,
  }
}

// The reader iframe, at `e.issuu.com/embed.html` or the document page pasted from the address bar,
// and the retired Flash reader.
const issuuResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url)

  if (!parsed) {
    return
  }

  const route = getPathSegments(parsed)[0] ?? ''

  if (isAnyOf(route, flashRoute)) {
    return readFlashDocument(parsed, element)
  }

  // The share snippet writes the publication name on the iframe, which neither url form holds.
  const title = attr(element, 'title')

  if (!isAnyOf(route, embedPaths)) {
    const embed = readDocumentUrl(url)

    return embed && { ...embed, title }
  }
  // The two id spaces the carrier can name, in the order the reader states them: a config id
  // pair in the fragment, else the publisher and document names in the query.
  const embed =
    composeConfigEmbed(parsed.hash.replace('#', '')) ??
    composeDocumentEmbed(
      parsed.searchParams.get('u') ?? undefined,
      parsed.searchParams.get('d') ?? undefined,
      parsed.searchParams.get('p') ?? undefined,
    )

  return embed && { ...embed, title }
}

export const issuuIframeEmbedResolver = createUrlEmbedResolver(issuuHosts, issuuResolveEmbed)

export const issuuFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'issuu.com' },
]
