import { decodeSegment, getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import {
  absoluteUrlRegex,
  composeQuery,
  isFileName,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'office'

const officeHosts = ['view.officeapps.live.com']

// The snippet writes `embed.aspx` and the share link `view.aspx`. Both frame the same viewer, and
// the viewer answers any casing.
const viewerPathRegex = /^\/+op\/(?:embed|view)\.aspx$/i

// The document, the slide aspect ratio and the slide the deck opens on. Tracking such as `utm_*`,
// `_hsenc` and the share link's `wdOrigin` is dropped.
const viewerParams = ['src', 'wdAr', 'wdStartOn']

// A download endpoint or a directory ends on a segment that names no file.
const readFileName = (documentUrl: string): string | undefined => {
  const segment = getPathSegments(parseUrl(documentUrl, placeholderBaseUrl) ?? '').at(-1)

  if (!segment || !isFileName(segment)) {
    return
  }

  return decodeSegment(segment) ?? segment
}

// Microsoft's Office viewer, which renders somebody else's document and carries the whole payload
// as the `src` query parameter.
export const officeResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const documentUrl = parsed?.searchParams.get('src')

  if (!parsed || !documentUrl || !viewerPathRegex.test(parsed.pathname)) {
    return
  }

  // The viewer fetches the document from Microsoft's servers, so a path with no host loads nothing.
  if (!absoluteUrlRegex.test(documentUrl) && !documentUrl.startsWith('//')) {
    return
  }

  const query = composeQuery(pickQueryParams(parsed.search, viewerParams))

  // The viewer redirects `http:` to `https:`, and an `http:` frame is blocked as mixed content.
  // No id: the document url addresses no Microsoft endpoint, so there is no enrichment key.
  return {
    provider,
    src: `https://${parsed.host}${parsed.pathname}${query}`,
    url: documentUrl,
    title: readFileName(documentUrl),
  }
}

export const officeEmbedResolver = createUrlEmbedResolver(officeHosts, officeResolveEmbed)
