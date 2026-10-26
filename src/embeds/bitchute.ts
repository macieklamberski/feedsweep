import { getPathSegments, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bitchute'

const sizes = { video: { ratio: '16/9' } }

const bitchuteHosts = ['bitchute.com']

const bitchuteResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const [route, id] = getPathSegments(url)

  // The route word tells a video from a channel or a profile.
  if (!isAnyOf(route, ['embed', 'video'])) {
    return
  }

  if (!id) {
    return
  }

  const title = attr(element, 'title')

  // The cover image sits under the channel's hash, which the video url does not carry, and
  // `api.bitchute.com/oembed/?url={page}` answers with it, the title and the channel, key-free.
  return {
    provider,
    id,
    src: `https://www.bitchute.com/embed/${id}/`,
    url: `https://www.bitchute.com/video/${id}/`,
    ...sizes.video,
    title,
  }
}

// BitChute's player iframe on the www and the old host, carrying only a title.
export const bitchuteEmbedResolver = createUrlEmbedResolver(bitchuteHosts, bitchuteResolveEmbed)

// The player starts on `autoPlay` spelled `true` alone. Its default embed mode throws while
// building the title overlay, before it reaches the autoplay branch, so `embedMode=false` skips
// the overlay and lets the start run.
export const bitchuteRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoPlay: 'true', embedMode: 'false' },
}
