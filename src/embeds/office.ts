import { getPathSegments, parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { decodeOrKeep, parseUrlOnHosts, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'office'

const officeHosts = ['view.officeapps.live.com']

// The snippet writes `embed.aspx` and the share link `view.aspx`. Both frame the same viewer.
const viewerPathRegex = /^\/+op\/(?:embed|view)\.aspx$/

const readFileName = (documentUrl: string): string | undefined => {
  const parsed = parseUrl(documentUrl, placeholderBaseUrl)

  return parsed ? decodeOrKeep(getPathSegments(parsed).at(-1)) : undefined
}

// Microsoft's Office viewer, which renders somebody else's document and carries the whole payload
// as the `src` query parameter.
export const officeResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, officeHosts)
  const documentUrl = parsed?.searchParams.get('src')

  if (!parsed || !documentUrl || !viewerPathRegex.test(parsed.pathname)) {
    return
  }

  return {
    provider,
    id: documentUrl,
    src: parsed.href,
    url: documentUrl,
    title: readFileName(documentUrl),
  }
}

export const officeEmbedResolver = createUrlEmbedResolver(officeHosts, officeResolveEmbed)
