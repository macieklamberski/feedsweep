import { parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'namasha'

const namashaHosts = ['namasha.com']

// The server answers the route word and the id in any case.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/i

// A Namasha video player. The player seeks to the `t` in its query.
export const namashaResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const id = parsed?.pathname.match(embedPathRegex)?.[1]

  if (!parsed || !id) {
    return
  }

  return {
    provider,
    id: id.toLowerCase(),
    src: `https://www.namasha.com/embed/${id}${pickUrlParams(parsed.href, ['t'])}`,
    url: `https://www.namasha.com/v/${id}`,
    ratio: '16/9',
    title: attr(element, 'title'),
  }
}

export const namashaEmbedResolver = createUrlEmbedResolver(namashaHosts, namashaResolveEmbed)

// The embed page is a poster that loads the player on `autoplay=true`, which starts playback.
export const namashaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
