import { getPathSegments } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const bitchuteHosts = ['bitchute.com']

const bitchuteResolveEmbed: ResolveEmbed = (url, element) => {
  const [route, id] = getPathSegments(url)

  // The route word tells a video from a channel or a profile.
  if (route !== 'embed' && route !== 'video') {
    return
  }

  if (!id) {
    return
  }

  const title = attr(element, 'title')

  // The cover image sits under the channel's hash, which the video url does not carry, and
  // `api.bitchute.com/oembed/?url={page}` answers with it, the title and the channel, key-free.
  return {
    provider: 'bitchute',
    id,
    src: `https://www.bitchute.com/embed/${id}/`,
    url: `https://www.bitchute.com/video/${id}/`,
    title,
  }
}

// BitChute's player iframe on the www and the old host, carrying only a title.
// No render hint: the player reads `autoPlay` off its query, then gates `play()` on an unmuted
// autoplay probe and sits on its poster.
export const bitchuteEmbedResolver = createUrlEmbedResolver(bitchuteHosts, bitchuteResolveEmbed)
