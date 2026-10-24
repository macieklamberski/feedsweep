import { getQueryParam, isAnyOf, parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, pickQueryParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'videa'

const videaHosts = ['videa.hu']

// The player, and the retired Flash player whose `v` plays on it. The server matches both paths
// in their case only, and answers 404 with a trailing slash.
const playerPaths = ['/player', '/flvplayer.swf']

// A Videa video player, the iframe or the retired Flash player in an `<embed>` or `<object>`.
// The player reads the start position from `start`. The server answers an id in any case.
export const videaResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed || !isAnyOf(parsed.pathname, playerPaths)) {
    return
  }

  const id = getQueryParam(parsed.searchParams, 'v')

  if (!id) {
    return
  }

  const query = composeQuery({ v: id, ...pickQueryParams(parsed.search, ['start']) })

  return {
    provider,
    id,
    src: `https://videa.hu/player${query}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

export const videaEmbedResolver = createUrlEmbedResolver(videaHosts, videaResolveEmbed)

// The player starts playback when the query carries `autoplay=1`.
export const videaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
