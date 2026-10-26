import { getPathSegments, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'cspan'

const cspanHosts = ['c-span.org']

const sizes = { player: { ratio: '16/9' } }

const idEndRegex = /[/&]/

// C-SPAN's standalone player, `/video/standalone/?{id}/{slug}`, where the id is `c{n}` for a
// clip or `{program}-{n}` for a program and leads the query with no name. The player plays the
// id without its slug and reads `start` as the position.
export const cspanResolveEmbed: ResolveUrlEmbed = (url) => {
  const [video, standalone, ...rest] = getPathSegments(url)

  if (!isAnyOf(video, 'video') || !isAnyOf(standalone, 'standalone') || rest.length > 0) {
    return
  }

  const [id] = url.search.slice(1).split(idEndRegex)

  // A named parameter in the lead position is no id: the player answers it with an empty page.
  if (!id || id.includes('=')) {
    return
  }

  const params = new URLSearchParams(pickQueryParams(url.search, ['start']))
  const query = params.size ? `&${params}` : ''

  return {
    provider,
    id,
    src: `https://www.c-span.org/video/standalone/?${id}${query}`,
    url: `https://www.c-span.org/video/?${id}`,
    ...sizes.player,
  }
}

export const cspanEmbedResolver = createUrlEmbedResolver(cspanHosts, cspanResolveEmbed)
