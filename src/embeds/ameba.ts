import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const amebaHosts = ['static.blog-video.jp']

// An id is letters and digits, with no length band: the ids in the corpus run to 26 characters
// and a bound read off them would refuse the next generation.
const safeVideoIdRegex = /^[A-Za-z0-9]+$/

// Ameba's movie player, `static.blog-video.jp/?v={id}`, for a video uploaded into a blog post.
// The id is the whole key the platform's own endpoint takes. Its thumbnails are pathed by the
// blog's own user id, which the carrier does not name, so no poster is minted.
export const amebaResolveEmbed: ResolveEmbed = (url) => {
  const videoId = parseUrl(url, placeholderBaseUrl)?.searchParams.get('v')

  if (!videoId || !safeVideoIdRegex.test(videoId)) {
    return
  }

  return {
    provider: 'ameba',
    id: videoId,
    src: `https://${amebaHosts[0]}/?v=${videoId}`,
  }
}

export const amebaEmbedResolver = createUrlEmbedResolver(amebaHosts, amebaResolveEmbed)
