import { parseUrl } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import { attr, keepIfMatches } from '../utils/dom.js'
import { isOnHosts, parseUrlOnHosts, pickUrlParams, placeholderBaseUrl } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

// Every publisher plays from its own `customer-{accountCode}` subdomain.
const streamHosts = ['cloudflarestream.com']

const cloudflarestreamHosts = [...streamHosts, 'videodelivery.net']

// On the shared host the player answers under `iframe.` only: the bare host 404s the same path.
const deliveryPlayerHost = 'iframe.videodelivery.net'

// `iframe.videodelivery.net/{videoId}/thumbnails/thumbnail.jpg` answers with the player page.
// The image is served from the bare host.
const deliveryThumbnailHost = 'videodelivery.net'

const safeVideoIdRegex = /^[A-Za-z0-9]+$/
const playerPathRegex = /^\/([A-Za-z0-9]+)\/iframe\/?$/
const deliveryPathRegex = /^\/([A-Za-z0-9]+)\/?$/
const accountCodeRegex = /^customer-([A-Za-z0-9]+)\./

// `poster` names the image the player shows. `muted`, `preload`, `loop` and `autoplay` say how the
// player behaves for whoever is reading.
const playerParams = ['poster']

// A video id is scoped to the account holding it, and the same id on another publisher's
// `customer-*` host answers 404, so the account code travels beside it.
const composeId = (videoId: string, accountCode: string | undefined): string => {
  return accountCode ? `${accountCode}/${videoId}` : videoId
}

const composeThumbnail = (videoId: string, host: string): string => {
  return `https://${host}/${videoId}/thumbnails/thumbnail.jpg`
}

const readVideoId = (parsed: URL): string | undefined => {
  if (parsed.hostname === deliveryPlayerHost) {
    return parsed.pathname.match(deliveryPathRegex)?.[1]
  }

  if (isOnHosts(parsed, streamHosts)) {
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
  // The publisher's poster is the derivable thumbnail url, already written out.
  const poster = parsed.searchParams.get('poster')?.trim()

  return {
    provider: 'cloudflarestream',
    id: composeId(videoId, parsed.hostname.match(accountCodeRegex)?.[1]),
    src: `https://${parsed.hostname}${playerPath}${pickUrlParams(url, playerParams)}`,
    thumbnail: poster || composeThumbnail(videoId, thumbnailHost),
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
    const videoId = keepIfMatches(parsed?.searchParams.get('video'), safeVideoIdRegex)

    if (!videoId) {
      return
    }

    // The loader names no account, so the video is rebuilt on the shared host, which holds it
    // whichever account uploaded it.
    return {
      provider: 'cloudflarestream',
      id: videoId,
      src: `https://${deliveryPlayerHost}/${videoId}`,
      thumbnail: composeThumbnail(videoId, deliveryThumbnailHost),
    }
  },
)
