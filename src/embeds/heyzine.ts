import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'heyzine'

const heyzineHosts = ['heyzine.com']

// The embed id is a prefix of the flipbook's sha1, with or without the `.html` the snippet writes.
const flipBookIdRegex = /^([0-9a-f]+)(?:\.html)?$/

// Heyzine's flipbook viewer, which renders on its own and is its own page.
export const heyzineResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, heyzineHosts)
  const segments = parsed ? getPathSegments(parsed) : []
  const [route, name, ...rest] = segments
  const flipBookId = name?.match(flipBookIdRegex)?.[1]

  if (route !== 'flip-book' || !flipBookId || rest.length) {
    return
  }

  return {
    provider,
    id: flipBookId,
    src: `https://heyzine.com/flip-book/${flipBookId}.html`,
  }
}

export const heyzineEmbedResolver = createUrlEmbedResolver(heyzineHosts, heyzineResolveEmbed)
