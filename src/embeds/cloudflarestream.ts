import { isHostOrSubdomainOf, parseUrl } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import {
  absoluteUrlRegex,
  encodePathSegment,
  parseUrlOnHosts,
  pickUrlParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'cloudflarestream'

const cloudflarestreamHosts = [
  'cloudflarestream.com', // Every publisher's own `customer-{accountCode}` subdomain
  'videodelivery.net',
]

// On the shared host the player answers under `iframe.` only: the bare host 404s the same path.
const deliveryPlayerHost = 'iframe.videodelivery.net'

// `iframe.videodelivery.net/{videoId}/thumbnails/thumbnail.jpg` answers with the player page.
// The image is served from the bare host.
const deliveryThumbnailHost = 'videodelivery.net'

const playerPathRegex = /^\/([^/]+)\/iframe\/?$/
const deliveryPathRegex = /^\/([^/]+)\/?$/

const playerParams = ['poster', 'startTime']

const composeThumbnail = (videoId: string, host: string): string => {
  return `https://${host}/${videoId}/thumbnails/thumbnail.jpg`
}

const readVideoId = (parsed: URL): string | undefined => {
  if (parsed.hostname === deliveryPlayerHost) {
    return parsed.pathname.match(deliveryPathRegex)?.[1]
  }

  if (isHostOrSubdomainOf(parsed, cloudflarestreamHosts)) {
    return parsed.pathname.match(playerPathRegex)?.[1]
  }
}

export const cloudflarestreamResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const videoId = readVideoId(parsed)

  if (!videoId) {
    return
  }

  const isDelivery = parsed.hostname === deliveryPlayerHost
  const playerPath = isDelivery ? `/${videoId}` : `/${videoId}/iframe`
  const thumbnailHost = isDelivery ? deliveryThumbnailHost : parsed.hostname
  // A relative `poster` would resolve against the feed, not the player, so it is not read.
  const poster = keepIfMatches(parsed.searchParams.get('poster'), absoluteUrlRegex)

  return {
    provider,
    // The bare `videodelivery.net` serves every account's video, so the id needs no account code.
    id: videoId,
    src: `https://${parsed.hostname}${playerPath}${pickUrlParams(url, playerParams)}`,
    thumbnail: poster ?? composeThumbnail(videoId, thumbnailHost),
  }
}

// The Cloudflare Stream iframe, naming the video in its path.
export const cloudflarestreamIframeEmbedResolver = createUrlEmbedResolver(
  cloudflarestreamHosts,
  cloudflarestreamResolveEmbed,
)

// Cloudflare Stream's loader script, which writes the player into an empty sibling div. A reader
// runs no script, so the video is only in the loader's own `?video=`.
export const cloudflarestreamScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="videodelivery.net/embed/"], script[src*="cloudflarestream.com/embed/"]',
  (element) => {
    // The selector matches a substring any host can carry, so the host is checked here.
    const parsed = parseUrlOnHosts(attr(element, 'src'), cloudflarestreamHosts)
    const videoId = parsed?.searchParams.get('video')

    if (!videoId) {
      return
    }

    // The loader's `video` comes out of its query decoded, and it goes into a path.
    const segment = encodePathSegment(videoId)

    // The loader names no account, so the video is rebuilt on the shared host, which holds it
    // whichever account uploaded it.
    return {
      provider,
      id: videoId,
      src: `https://${deliveryPlayerHost}/${segment}`,
      thumbnail: composeThumbnail(segment, deliveryThumbnailHost),
    }
  },
)

export const cloudflarestreamRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
