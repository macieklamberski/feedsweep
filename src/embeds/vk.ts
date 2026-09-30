import { isPlainObject, parseUrl, toMap } from 'trousse'
import type { EmbedRenderHint, ResolveEmbed } from '../types.js'
import {
  composeQuery,
  encodePathSegment,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'vk'

const vkHosts = ['vk.com', 'vk.ru', 'vkontakte.ru', 'vkvideo.ru']

// The page a player opens is spelled with the endpoint's own word, on the host vk.com redirects
// videos to. A clip page on vk.com redirects to an unsupported-browser page instead.
// `video_embed` serves no player, so it mints onto `video_ext.php` with the same ids.
const players = toMap({
  '/clip_ext.php': { kind: 'clip', path: '/clip_ext.php' },
  '/video_embed': { kind: 'video', path: '/video_ext.php' },
  '/video_ext.php': { kind: 'video', path: '/video_ext.php' },
})

// `hash` unlocks a video its owner shared privately, so it stays in `src`. The page url drops it,
// since a public video's page ignores it. Quality and autoplay are the reader's call.
const playerParams = ['oid', 'id', 'hash']

// VK's player, `video_ext.php?oid={ownerId}&id={videoId}`, and the clip player beside it.
export const vkResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const player = players.get(parsed.pathname)
  const ownerId = parsed.searchParams.get('oid') ?? ''
  const videoId = parsed.searchParams.get('id') ?? ''

  if (!player || !ownerId || !videoId) {
    return
  }

  const params = pickQueryParams(parsed.search, playerParams)
  const id = `${ownerId}_${videoId}`
  const src = `https://${parsed.hostname}${player.path}${composeQuery(params)}`

  return {
    provider,
    id,
    src,
    // Both ids come out of the query decoded, and they go into a path.
    url: `https://vkvideo.ru/${player.kind}${encodePathSegment(id)}`,
  }
}

export const vkEmbedResolver = createUrlEmbedResolver(vkHosts, vkResolveEmbed)

// The player posts its state with `event: 'inited'` once it has loaded, and only when `js_api` is
// on its url.
export const isVkReady = (data: unknown): boolean => {
  return isPlainObject(data) && data.event === 'inited'
}

// See: https://vk.com/js/api/videoplayer.js.
// `autoplay=1` starts the player muted, while a play command starts it with sound.
export const vkRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { js_api: '1' },
  isReady: isVkReady,
  requestPlay: { method: 'play' },
}
