import { composeQuery } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'mediaccc'

const sizes = {
  player: { ratio: '16/9' },
}

// `app.media.ccc.de` serves the same player on the same paths.
const hosts = ['media.ccc.de']

// The server matches the slug in its case only.
const playerPathRegex = /^\/v\/([^/]+)\/oembed\/?$/i

// The player seeks to the `#t=` it reads from the hash. A WordPress auto-embed writes
// `#?secret=` there.
const readStartFragment = (parsed: URL): string => {
  const hashQuery = parsed.hash.slice(1)
  const startTime = pickQueryParams(hashQuery, ['t'])
  const query = composeQuery(startTime)

  return query.replace('?', '#')
}

// The player of a media.ccc.de talk, the iframe its oEmbed answer writes. The talk page refuses
// framing.
export const mediacccResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const slug = url.pathname.match(playerPathRegex)?.[1]

  if (!slug) {
    return
  }

  return {
    provider,
    id: slug,
    src: `https://media.ccc.de/v/${slug}/oembed${readStartFragment(url)}`,
    url: `https://media.ccc.de/v/${slug}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const mediacccEmbedResolver = createUrlEmbedResolver(hosts, mediacccResolveEmbed)
