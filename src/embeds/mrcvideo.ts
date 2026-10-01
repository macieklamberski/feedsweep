import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'mrcvideo'

// `mrctv.org` and `www.mrctv.org` 301 onto `mrcvideo.org/embed/{same id}`.
const mrcvideoHosts = ['mrcvideo.org', 'mrctv.org']

// MRC Video's embed iframe, `/embed/{id}`, on the current host and the former MRCTV one. The route
// word answers in any case.
const mrcvideoResolveEmbed: ResolveEmbed = (url) => {
  const [route, id, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'embed') || !id || rest.length > 0) {
    return
  }

  // No `url`: the oEmbed endpoint answers only the slug page, which the id cannot compose.
  return {
    provider,
    id,
    src: `https://mrcvideo.org/embed/${id}`,
    ratio: '16/9',
  }
}

export const mrcvideoEmbedResolver = createUrlEmbedResolver(mrcvideoHosts, mrcvideoResolveEmbed)

// The player calls `play()` when its query holds `autoplay`, whatever the value.
export const mrcvideoRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
