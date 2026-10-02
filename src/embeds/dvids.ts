import type { ResolveEmbed } from '../types.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dvids'

const dvidsHosts = ['dvidshub.net']

// The server matches the path in its own case only.
const playerPathRegex = /^\/video\/embed\/([^/]+)\/?$/

// DVIDS' video player, `/video/embed/{id}`, the url its share dialog writes. The page
// `/video/{id}` 301s to the video's slugged page.
export const dvidsResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, dvidsHosts)
  const id = parsed?.pathname.match(playerPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://www.dvidshub.net/video/embed/${id}`,
    url: `https://www.dvidshub.net/video/${id}`,
    ratio: '16/9',
  }
}

export const dvidsEmbedResolver = createUrlEmbedResolver(dvidsHosts, dvidsResolveEmbed)
