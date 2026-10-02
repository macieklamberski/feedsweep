import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'mediaccc'

// `app.media.ccc.de` serves the same player on the same paths.
const mediacccHosts = ['media.ccc.de']

// The server matches the route words and the slug in their case only.
const playerPathRegex = /^\/v\/([^/]+)\/oembed\/?$/

// The player seeks to the `#t=` it reads from the hash. A WordPress auto-embed writes
// `#?secret=` there.
const readStartFragment = (parsed: URL): string => {
  const query = composeQuery(pickQueryParams(parsed.hash.slice(1), ['t']))

  return query.replace('?', '#')
}

// The player of a media.ccc.de talk, the iframe its oEmbed answer writes. The talk page refuses
// framing.
export const mediacccResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const slug = parsed?.pathname.match(playerPathRegex)?.[1]

  if (!parsed || !slug) {
    return
  }

  return {
    provider,
    id: slug,
    src: `https://media.ccc.de/v/${slug}/oembed${readStartFragment(parsed)}`,
    url: `https://media.ccc.de/v/${slug}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

export const mediacccEmbedResolver = createUrlEmbedResolver(mediacccHosts, mediacccResolveEmbed)
