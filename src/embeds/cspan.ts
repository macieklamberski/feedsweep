import { composeQuery, getPathSegments, getQueryParams, isAnyOf } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'cspan'

const hosts = ['c-span.org']

const sizes = {
  player: { ratio: '16/9' },
}

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

  // The id leads the query with no name, so the kept pairs follow it after `&`.
  const query = composeQuery(getQueryParams(url, ['start'])).replace('?', '&')

  return {
    provider,
    id,
    src: `https://www.c-span.org/video/standalone/?${id}${query}`,
    url: `https://www.c-span.org/video/?${id}`,
    ...sizes.player,
  }
}

export const cspanEmbedResolver = createUrlEmbedResolver(hosts, cspanResolveEmbed)
