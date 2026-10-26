import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dzen'

const dzenHosts = ['dzen.ru']

const embedPathRegex = /^\/embed\/([^/]+)\/?$/i

// Dzen's video player, `dzen.ru/embed/{id}`. The player reads `t` as the start position.
export const dzenResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = url.pathname.match(embedPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://dzen.ru/embed/${id}${pickUrlParams(url, ['t'])}`,
    ratio: '16/9',
  }
}

export const dzenEmbedResolver = createUrlEmbedResolver(dzenHosts, dzenResolveEmbed)

export const dzenRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
