import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { parseUrlOnHosts, pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dzen'

const dzenHosts = ['dzen.ru']

const embedPathRegex = /^\/embed\/([^/]+)\/?$/

// Dzen's video player, `dzen.ru/embed/{id}`. The player reads `t` as the start position.
export const dzenResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, dzenHosts)

  if (!parsed) {
    return
  }

  const id = parsed.pathname.match(embedPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://dzen.ru/embed/${id}${pickUrlParams(parsed.href, ['t'])}`,
    ratio: '16/9',
  }
}

export const dzenEmbedResolver = createUrlEmbedResolver(dzenHosts, dzenResolveEmbed)

export const dzenRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
