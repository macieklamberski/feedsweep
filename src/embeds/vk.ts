import { parseUrl, toMap } from 'trousse'
import type { ResolveEmbed } from '../types.js'
import {
  composeQuery,
  encodePathSegment,
  pickQueryParams,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

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
    provider: 'vk',
    id,
    src,
    // Both ids come out of the query decoded, and they go into a path.
    url: `https://vkvideo.ru/${player.kind}${encodePathSegment(id)}`,
  }
}

export const vkEmbedResolver = createUrlEmbedResolver(vkHosts, vkResolveEmbed)
