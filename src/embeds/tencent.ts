import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import { isFileName, parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'tencent'

// A vid of cover is an unfilled snippet's route word, and it mints a grey poster and a dead link.
// The word is Tencent's own, from `v.qq.com/x/cover/{cid}/{vid}.html`.
const nonVideoWords = new Set(['cover'])

// `v.qq.com` serves the player; the other two served the Flash player.
const tencentHosts = ['v.qq.com', 'static.video.qq.com', 'imgcache.qq.com']

// `/txp/iframe/player.html` is the current player. The older `/iframe/player.html` is a stub that
// `location.replace`s onto it, and `/iframe/preview.html` is the mobile player of the same era.
const playerPathRegex = /^\/(?:txp\/iframe\/player|iframe\/player|iframe\/preview)\.html$/
const flashPathRegex = /\/TPout\.swf$/i

// The 640x498 and 500x375 boxes the older carriers state held the retired player's chrome.
// The player is chromeless and fills its box, and Tencent's own snippet states no size at all.
const playerRatio = '16/9'

const readVideoId = (url: string): string | undefined => {
  const parsed = parseUrlOnHosts(url, tencentHosts)
  const pathRegex = parsed?.hostname === 'v.qq.com' ? playerPathRegex : flashPathRegex

  if (!parsed || !pathRegex.test(parsed.pathname)) {
    return
  }

  const videoId = parsed.searchParams.get('vid')

  // Tencent serves video on the player host, so a file name in vid is an enclosure.
  if (!videoId || isFileName(videoId) || nonVideoWords.has(videoId)) {
    return
  }

  return videoId
}

// Tencent Video's player iframe and the dead Flash TPout.swf carrier, both naming the video in vid.
const tencentResolveEmbed: ResolveEmbed = (url) => {
  const videoId = readVideoId(url)

  if (!videoId) {
    return
  }

  return {
    provider,
    id: videoId,
    src: `https://v.qq.com/txp/iframe/player.html?vid=${videoId}`,
    url: `https://v.qq.com/x/page/${videoId}.html`,
    // The poster the watch page shows, addressed by the id alone, and an invented id gets a 5 KB
    // png placeholder. `vv.video.qq.com/getinfo?vids={vid}&otype=json` answers key-free with the
    // title, the duration and the frame size.
    thumbnail: `https://puui.qpic.cn/qqvideo_ori/0/${videoId}_496_280/0`,
    ratio: playerRatio,
  }
}

export const tencentEmbedResolver = createUrlEmbedResolver(tencentHosts, tencentResolveEmbed, {
  preferResolverSize: true,
})

// The player reads a boolean setting as the string `true`, so `autoplay=1` stays paused.
export const tencentRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: 'true' },
}
