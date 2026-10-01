import { getPathSegments, isPlainObject } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'nicovideo'

// lv names a live broadcast, which the video player answers 500 for and the live host serves as a
// programme card even after the broadcast ends.
const liveIdRegex = /^lv\d+$/

const nicovideoHosts = ['nicovideo.jp']

// Seiga and manga write ext.{site}.nicovideo.jp/thumb/{kind}{digits}, and news writes
// news.nicovideo.jp/watch/nw{digits}.
const nonVideoHosts = ['seiga.nicovideo.jp', 'manga.nicovideo.jp', 'news.nicovideo.jp']

const videoIdMarkers = ['thumb_watch', 'thumb', 'watch', 'embed']

export const extractNicovideoId = (link: string): string | undefined => {
  // The script selector matches on a substring, so any host can spell `nicovideo.jp/thumb_watch`
  // inside its own path and reach this. The path shape alone must not mint a nicovideo url.
  const parsed = parseUrlOnHosts(link, nicovideoHosts)

  // Seiga, manga and news ids pass the video grammar, and the video player answers 500 for them.
  if (!parsed || parseUrlOnHosts(link, nonVideoHosts)) {
    return
  }

  // Every player and card route opens the path, and a marker deeper in it is another page's.
  const [marker, videoId] = getPathSegments(parsed)

  if (!marker || !videoIdMarkers.includes(marker)) {
    return
  }

  return videoId
}

export const nicovideoResolveEmbed: ResolveEmbed = (url) => {
  const videoId = extractNicovideoId(url)

  if (!videoId) {
    return
  }

  // A broadcast is served by the live host and nothing else, so the two kinds do not share a
  // player url. No size is stated for it: a guess would outrank the height the carrier states.
  if (liveIdRegex.test(videoId)) {
    return {
      provider,
      id: videoId,
      src: `https://live.nicovideo.jp/embed/${videoId}`,
      url: `https://live.nicovideo.jp/watch/${videoId}`,
    }
  }

  // embed.nicovideo.jp/watch/{id} answers a real id 200 with the title and an invented one 500.
  return {
    provider,
    id: videoId,
    src: `https://embed.nicovideo.jp/watch/${videoId}`,
    url: `https://www.nicovideo.jp/watch/${videoId}`,
  }
}

// The legacy ext.nicovideo.jp/thumb/{id} iframe card, which now answers 403 to every user agent.
export const nicovideoIframeEmbedResolver = createUrlEmbedResolver(
  nicovideoHosts,
  nicovideoResolveEmbed,
)

// Nicovideo's thumb_watch script writes the player where it stands, and a reader never runs it.
// Nicovideo answers it with a 302 to embed.nicovideo.jp/watch/{id}/script.
export const nicovideoScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="nicovideo.jp/thumb_watch"], script[src*="embed.nicovideo.jp/watch"]',
  (element) => {
    const source = attr(element, 'src') ?? ''
    const result = nicovideoResolveEmbed(source)

    if (!result) {
      return
    }

    return { ...result, ratio: '16/9' }
  },
)

// The player posts `loadComplete` once it has loaded, and only when `jsapi` is on its url.
export const isNicovideoReady = (data: unknown): boolean => {
  return isPlainObject(data) && data.eventName === 'loadComplete'
}

// The player takes commands only from the origin of its `document.referrer`, and only for the
// `playerId` on its url.
export const nicovideoRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { jsapi: '1', playerId: '1' },
  isReady: isNicovideoReady,
  requestPlay: { sourceConnectorType: 1, playerId: '1', eventName: 'play' },
}
