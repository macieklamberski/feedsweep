import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dvids'

const hosts = ['dvidshub.net']

// The server matches the path in its own case only.
const playerPathRegex = /^\/video\/embed\/([^/]+)\/?$/i

const sizes = {
  player: { ratio: '16/9' },
}

// DVIDS' video player, `/video/embed/{id}`, the url its share dialog writes. The page
// `/video/{id}` 301s to the video's slugged page.
export const dvidsResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = url.pathname.match(playerPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.dvidshub.net/video/embed/${id}`,
    url: `https://www.dvidshub.net/video/${id}`,
    ...sizes.player,
  }
}

export const dvidsEmbedResolver = createUrlEmbedResolver(hosts, dvidsResolveEmbed)
