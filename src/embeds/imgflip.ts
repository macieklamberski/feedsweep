import type { ResolveUrlEmbed } from '../types.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'imgflip'

const hosts = ['imgflip.com']

const gifPathRegex = /^\/embed\/([^/]+)\/?$/i

const sizes = {
  // Imgflip draws each GIF at its own ratio, which its snippet writes on the frame. A frame that
  // declares no box gets 16:9, the commonest ratio among the corpus's GIF frames.
  gif: { ratio: '16/9' },
}

// The GIF frame Imgflip's embed dialog writes, imgflip.com/embed/{id}.
const imgflipResolveEmbed: ResolveUrlEmbed = (url) => {
  const id = url.pathname.match(gifPathRegex)?.[1]

  if (!id) {
    return
  }

  return {
    provider,
    id,
    src: `https://imgflip.com/embed/${id}`,
    url: `https://imgflip.com/gif/${id}`,
    thumbnail: `https://i.imgflip.com/2/${id}.jpg`,
    ...sizes.gif,
  }
}

export const imgflipEmbedResolver = createUrlEmbedResolver(hosts, imgflipResolveEmbed, {
  readCarrierSize: true,
})
