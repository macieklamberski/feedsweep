import type { EmbedResolver, EmbedResolverResult, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'aparat'

const sizes = {
  // Most iframes that state a size are 16:9, and the script carrier states no size at all.
  player: { ratio: '16/9' },
}

const hosts = ['aparat.com']
const scriptPathRegex = /^\/embed\/([^/]+)$/i
const framePathRegex = /^\/video\/video\/embed\/videohash\/([^/]+)(?:\/vt\/frame)?\/?$/i

// `aparat.com/etc/api/video/videohash/{hash}` answers with the title, the uploader, the duration
// and a poster, with no key. The poster's asset url is signed with a `secret=` parameter.
const composeEmbed = (videoHash: string): EmbedResolverResult => {
  return {
    provider,
    id: videoHash,
    src: `https://www.aparat.com/video/video/embed/videohash/${videoHash}/vt/frame`,
    url: `https://www.aparat.com/v/${videoHash}`,
    ...sizes.player,
  }
}

const readVideoHash = (url: URL | undefined, pathRegex: RegExp): string | undefined => {
  return url?.pathname.match(pathRegex)?.[1]
}

const aparatResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const videoHash = readVideoHash(url, framePathRegex)

  if (!videoHash) {
    return
  }

  return {
    ...composeEmbed(videoHash),
    title: attr(element, 'title'),
  }
}

// Aparat's player iframe.
export const aparatIframeEmbedResolver: EmbedResolver = createUrlEmbedResolver(
  hosts,
  aparatResolveEmbed,
)

// Aparat's WordPress-style facade: a script inside an empty div that never runs in a reader.
// Its src is `aparat.com/embed/{hash}`, usually with no companion iframe anywhere in the item.
export const aparatScriptEmbedResolver = createMarkupEmbedResolver(
  hosts.map((host) => `script[src*="${host}/embed/" i]`).join(', '),
  (element) => {
    // The selector guarantees the host substring is in the src, so only the host and the path
    // shape can reject here. The `data[rnddiv]` and `data[responsive]` query the facade carries
    // name the div the script would have written into, and say nothing about the video.
    const script = parseUrlOnHosts(attr(element, 'src'), hosts)
    const videoHash = readVideoHash(script, scriptPathRegex)

    if (!videoHash) {
      return
    }

    return composeEmbed(videoHash)
  },
)
