import { composeQuery, decodeSegment, getPathSegments, getQueryParam, parseUrl } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { absoluteUrlRegex, isFileName, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'office'

const officeHosts = ['view.officeapps.live.com']

// The snippet writes `embed.aspx` and the share link `view.aspx`. Both render the same document,
// and the viewer answers any casing.
const viewerPathRegex = /^\/op\/(?:embed|view)\.aspx$/i

const sizes = {
  player: { ratio: '8/5' },
}

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
export const officeResolveEmbed: ResolveUrlEmbed = (url) => {
  const documentUrl = getQueryParam(url.searchParams, 'src')

  if (!documentUrl || !viewerPathRegex.test(url.pathname)) {
    return
  }

  // The viewer fetches the document from Microsoft's servers, so a path with no host loads nothing.
  if (!absoluteUrlRegex.test(documentUrl) && !documentUrl.startsWith('//')) {
    return
  }

  // No id: the document url addresses no Microsoft endpoint, so there is no enrichment key.
  return {
    provider,
    src: `https://view.officeapps.live.com/op/embed.aspx${composeQuery({ src: documentUrl })}`,
    url: documentUrl,
    ...sizes.player,
    title: readFileName(documentUrl),
  }
}

export const officeEmbedResolver = createUrlEmbedResolver(officeHosts, officeResolveEmbed)
