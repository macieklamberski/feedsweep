import type { ResolveEmbed } from '../types.js'
import { composeQuery, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const vkHosts = ['vk.com', 'vkvideo.ru']

// An owner id is negative for a community, and a video id is a plain number.
const safeOwnerIdRegex = /^-?\d+$/
const safeVideoIdRegex = /^\d+$/

// The page a player opens is spelled with the endpoint's own word.
const playerKinds: Record<string, string> = {
  '/video_ext.php': 'video',
  '/clip_ext.php': 'clip',
}

// `hd` picks the quality and `hash` unlocks a video its owner shared privately.
const playerParams = ['hd', 'hash']

// VK's player, `video_ext.php?oid={ownerId}&id={videoId}`, and the clip player beside it.
export const vkResolveEmbed: ResolveEmbed = (url) => {
  const parsed = parseUrlOnHosts(url, vkHosts)

  if (!parsed) {
    return
  }

  const kind = playerKinds[parsed.pathname]
  const ownerId = parsed.searchParams.get('oid') ?? ''
  const videoId = parsed.searchParams.get('id') ?? ''

  if (!kind || !safeOwnerIdRegex.test(ownerId) || !safeVideoIdRegex.test(videoId)) {
    return
  }

  const query = composeQuery({
    oid: ownerId,
    id: videoId,
    ...pickQueryParams(parsed.search, playerParams),
  })

  return {
    provider: 'vk',
    id: `${ownerId}_${videoId}`,
    src: `https://${parsed.hostname}${parsed.pathname}${query}`,
    url: `https://vk.com/${kind}${ownerId}_${videoId}`,
  }
}

export const vkEmbedResolver = createUrlEmbedResolver(vkHosts, vkResolveEmbed)
