import { composeQuery, encodePathSegment, getPathSegments, getQueryParam, toMap } from 'trousse'
import type { ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bundestag'

const sizes = {
  player: { ratio: '16/9' },
}

const bundestagHosts = ['webtv.bundestag.de']

const idParams = toMap({
  'pservices/player/embed/nokey': 'c',
  'player/macros/bttv/hls/player.js': 'content',
})

// The Bundestag media library's player, `webtv.bundestag.de/pservices/player/embed/nokey?c={id}`,
// and its loader script `player/macros/bttv/hls/player.js?content={id}`, which builds the same
// player with config `bt-od` and policy `69`, the values every frame writes as `e` and `ep`.
export const bundestagResolveEmbed: ResolveUrlEmbed = (url) => {
  const name = idParams.get(getPathSegments(url).join('/').toLowerCase())

  if (!name) {
    return
  }

  const id = getQueryParam(url.searchParams, name)

  if (!id) {
    return
  }

  const query = composeQuery({ e: 'bt-od', ep: '69', a: '144277506', c: id })

  return {
    provider,
    id,
    src: `https://webtv.bundestag.de/pservices/player/embed/nokey${query}`,
    // The query id comes out decoded, and it goes into the page path.
    url: `https://dbtg.tv/cvid/${encodePathSegment(id)}`,
    ...sizes.player,
  }
}

export const bundestagIframeEmbedResolver = createUrlEmbedResolver(
  bundestagHosts,
  bundestagResolveEmbed,
)

export const bundestagScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="webtv.bundestag.de/player/" i]',
  (element) => {
    const url = parseUrlOnHosts(attr(element, 'src'), bundestagHosts)

    if (!url) {
      return
    }

    return bundestagResolveEmbed(url)
  },
)
