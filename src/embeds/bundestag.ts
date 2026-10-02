import { getPathSegments, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { composeQuery, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const bundestagHosts = ['webtv.bundestag.de']

const idParams = toMap({
  'pservices/player/embed/nokey': 'c',
  'player/macros/bttv/hls/player.js': 'content',
})

// The Bundestag media library's player, `webtv.bundestag.de/pservices/player/embed/nokey?c={id}`,
// and its loader script `player/macros/bttv/hls/player.js?content={id}`, which builds the same
// player with config `bt-od` and policy `69`, the values every frame writes as `e` and `ep`.
export const bundestagResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, bundestagHosts)

  if (!parsed) {
    return
  }

  const name = idParams.get(getPathSegments(parsed).join('/'))

  if (!name) {
    return
  }

  const id = parsed.searchParams.get(name)

  if (!id) {
    return
  }

  const query = composeQuery({ e: 'bt-od', ep: '69', a: '144277506', c: id })

  return {
    provider: 'bundestag',
    id,
    src: `https://webtv.bundestag.de/pservices/player/embed/nokey${query}`,
    url: `https://dbtg.tv/cvid/${id}`,
    ratio: '16/9',
  }
}

export const bundestagIframeEmbedResolver = createUrlEmbedResolver(
  bundestagHosts,
  bundestagResolveEmbed,
)

export const bundestagScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="webtv.bundestag.de/player/"]',
  (element) => {
    return bundestagResolveEmbed(attr(element, 'src') ?? '')
  },
)
