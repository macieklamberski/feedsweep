import { composeQuery, getQueryParam, getQueryParams, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'videa'

const hosts = ['videa.hu']

// The player, and the retired Flash player whose `v` plays on it. The server matches both paths
// in their case only, and answers 404 with a trailing slash.
const playerPaths = ['/player', '/flvplayer.swf']

const sizes = {
  player: { ratio: '16/9' },
}

// A Videa video player, the iframe or the retired Flash player in an `<embed>` or `<object>`.
// The player reads the start position from `start`. The server answers an id in any case.
export const videaResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (!isAnyOf(url.pathname, playerPaths)) {
    return
  }

  const id = getQueryParam(url.searchParams, 'v')

  if (!id) {
    return
  }

  const query = composeQuery({ v: id, ...getQueryParams(url.search, ['start']) })

  return {
    provider,
    id,
    src: `https://videa.hu/player${query}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const videaEmbedResolver = createUrlEmbedResolver(hosts, videaResolveEmbed)

// The player starts playback when the query carries `autoplay=1`.
export const videaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
