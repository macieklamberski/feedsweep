import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { pickUrlParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'namasha'

const sizes = {
  video: { ratio: '16/9' },
}

const namashaHosts = ['namasha.com']

// The server answers the route word and the id in any case.
const embedPathRegex = /^\/embed\/([^/]+)\/?$/i

// A Namasha video player. The embed page carries `t` into the player url.
export const namashaResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const id = url.pathname.match(embedPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.namasha.com/embed/${id}${pickUrlParams(url, ['t'])}`,
    url: `https://www.namasha.com/v/${id}`,
    ...sizes.video,
    title: attr(element, 'title'),
  }
}

export const namashaEmbedResolver = createUrlEmbedResolver(namashaHosts, namashaResolveEmbed)

// The embed page is a poster that loads the player on `autoplay=true`, which starts playback.
export const namashaRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
