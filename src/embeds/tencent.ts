import { composeQuery, encodePathSegment, getQueryParam, isAnyOf } from 'trousse'
import type { EmbedRenderHint, ResolveUrlEmbed } from '../types.js'
import { isFileName } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tencent'

// A vid of cover is an unfilled snippet's route word, and it mints a grey poster and a dead link.
// The word is Tencent's own, from `v.qq.com/x/cover/{cid}/{vid}.html`.
const nonVideoWords = ['cover']

// `v.qq.com` serves the player; the other two served the Flash player.
const tencentHosts = ['v.qq.com', 'static.video.qq.com', 'imgcache.qq.com']

// `/txp/iframe/player.html` is the current player. The older `/iframe/player.html` is a stub that
// `location.replace`s onto it, and `/iframe/preview.html` is the mobile player of the same era.
const playerPathRegex = /^\/(?:txp\/iframe\/player|iframe\/player|iframe\/preview)\.html$/i
const flashPathRegex = /\/TPout\.swf$/i

const sizes = {
  // The 640x498 and 500x375 boxes the older carriers state held the retired player's chrome.
  // The player is chromeless and fills its box, and Tencent's own snippet states no size at all.
  player: { ratio: '16/9' },
}

const readVideoId = (url: URL): string | undefined => {
  const pathRegex = url.hostname === 'v.qq.com' ? playerPathRegex : flashPathRegex

  if (!pathRegex.test(url.pathname)) {
    return
  }

  const videoId = getQueryParam(url.searchParams, 'vid')

  // Tencent serves video on the player host, so a file name in vid is an enclosure.
  if (!videoId || isFileName(videoId) || isAnyOf(videoId, nonVideoWords)) {
    return
  }

  return videoId
}

// Tencent Video's player iframe and the dead Flash TPout.swf carrier, both naming the video in vid.
const tencentResolveEmbed: ResolveUrlEmbed = (url) => {
  const videoId = readVideoId(url)

  if (!videoId) {
    return
  }

  // The query id comes out decoded, and it goes into the page and poster paths.
  const segment = encodePathSegment(videoId)

  return {
    provider,
    id: videoId,
    src: `https://v.qq.com/txp/iframe/player.html${composeQuery({ vid: videoId })}`,
    url: `https://v.qq.com/x/page/${segment}.html`,
    // The poster the watch page shows, addressed by the id alone, and an invented id gets a 5 KB
    // png placeholder. `vv.video.qq.com/getinfo?vids={vid}&otype=json` answers key-free with the
    // title, the duration and the frame size.
    thumbnail: `https://puui.qpic.cn/qqvideo_ori/0/${segment}_496_280/0`,
    ...sizes.player,
  }
}

export const tencentEmbedResolver = createUrlEmbedResolver(tencentHosts, tencentResolveEmbed)

// The player reads a boolean setting as the string `true`, so `autoplay=1` stays paused.
export const tencentRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
