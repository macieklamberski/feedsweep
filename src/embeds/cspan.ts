import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const cspanHosts = ['c-span.org']

const idEndRegex = /[/&]/

// C-SPAN's standalone player, `/video/standalone/?{id}/{slug}`, where the id is `c{n}` for a
// clip or `{program}-{n}` for a program and leads the query with no name. The player plays the
// id without its slug and reads `start` as the position.
export const cspanResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, cspanHosts)

  if (!parsed) {
    return
  }

  const [video, standalone, ...rest] = getPathSegments(parsed)

  if (video !== 'video' || standalone !== 'standalone' || rest.length > 0) {
    return
  }

  const [id] = parsed.search.slice(1).split(idEndRegex)

  // A named parameter in the lead position is no id: the player answers it with an empty page.
  if (!id || id.includes('=')) {
    return
  }

  const params = new URLSearchParams(pickQueryParams(parsed.search, ['start']))
  const query = params.size ? `&${params}` : ''

  return {
    provider: 'cspan',
    id,
    src: `https://www.c-span.org/video/standalone/?${id}${query}`,
    url: `https://www.c-span.org/video/?${id}`,
    ratio: '16/9',
  }
}

export const cspanEmbedResolver = createUrlEmbedResolver(cspanHosts, cspanResolveEmbed)
