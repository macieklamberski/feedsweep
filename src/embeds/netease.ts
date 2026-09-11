import { toMap } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'netease'

const neteaseHosts = ['music.163.com']

const safeIdRegex = /^\d+$/

// The map `pt_outchain_player.js` branches on: the number picks the endpoint the player calls
// and names the page the id belongs to. The retired Flash snippet spells the same numbers.
const typeRoutes = toMap({
  '0': 'playlist',
  '1': 'album',
  '2': 'song',
  '3': 'program',
  '4': 'djradio',
})

const playerPathRegex = /^\/+outchain\/player\/?$/
const flashPlayerPathRegex = /^\/+style\/swf\/widget\.swf$/

const composeResult = (
  type: string,
  id: string,
  height: string | null,
): EmbedResolverResult | undefined => {
  const route = typeRoutes.get(type)

  if (!route || !safeIdRegex.test(id)) {
    return
  }

  // The player picks its layout from `height`, so it names the form the publisher chose.
  const params: Record<string, string> = height ? { type, id, height } : { type, id }

  return {
    provider,
    id: `${route}/${id}`,
    src: `https://music.163.com/outchain/player${composeQuery(params)}`,
    url: `https://music.163.com/${route}?id=${id}`,
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
    return composeResult(query.get('type') ?? '', query.get('id') ?? '', query.get('height'))
  }

  if (flashPlayerPathRegex.test(parsed.pathname)) {
    return composeResult(query.get('type') ?? '', query.get('sid') ?? '', query.get('height'))
  }
}

export const neteaseEmbedResolver = createUrlEmbedResolver(neteaseHosts, neteaseResolveEmbed)

// `auto` is the parameter the player reads to start playback.
export const neteaseRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { auto: '1' },
}
