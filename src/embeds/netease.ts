import { toMap } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'netease'

const neteaseHosts = ['music.163.com']

// The map `pt_outchain_player.js` branches on: the number picks the endpoint the player calls
// and names the page the id belongs to. The retired Flash snippet writes `type=2` for a song too.
const typeRoutes = toMap({
  '0': 'playlist',
  '1': 'album',
  '2': 'song',
  '3': 'program',
  '4': 'djradio',
})

const playerPathRegex = /^\/+outchain\/player\/?$/
const flashPlayerPathRegex = /^\/+style\/swf\/widget\.swf$/

// Without `height` the player loads its list layout and fills its box. 250 shows the header, about
// three tracks and the footer, so a playlist shows that it holds more than one.
const playerHeight = 250

const composeResult = (type: string, id: string): EmbedResolverResult | undefined => {
  const route = typeRoutes.get(type)

  if (!route || !id) {
    return
  }

  return {
    provider,
    id: `${route}/${id}`,
    src: `https://music.163.com/outchain/player${composeQuery({ type, id })}`,
    url: `https://music.163.com/${route}${composeQuery({ id })}`,
    height: playerHeight,
  }
}

// NetEase Cloud Music's outchain player, and the Flash widget it replaced, which names the song
// as `sid` and renders nothing today.
export const neteaseResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, neteaseHosts)

  if (!parsed) {
    return
  }

  const query = parsed.searchParams

  if (playerPathRegex.test(parsed.pathname)) {
    return composeResult(query.get('type') ?? '', query.get('id') ?? '')
  }

  if (flashPlayerPathRegex.test(parsed.pathname)) {
    return composeResult(query.get('type') ?? '', query.get('sid') ?? '')
  }
}

export const neteaseEmbedResolver = createUrlEmbedResolver(neteaseHosts, neteaseResolveEmbed)

export const neteaseRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { auto: '1' },
}
