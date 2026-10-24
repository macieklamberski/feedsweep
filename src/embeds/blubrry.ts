import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'

const provider = 'blubrry'

import { placeholderBaseUrl } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  readCarrierUrl,
} from '../utils/widgets.js'

const blubrryHosts = ['blubrry.com']

// The player is 164 tall, one less than the 165 publishers write.
// A fixed height on a fluid width, and still 164 inside a 100-tall frame.
const playerHeight = 164

// The players PowerPress writes into an embed url for a video file, per
// `powerpressplayer_embedable` in its powerpress-player.php. Every other value is an audio player.
const powerpressVideoPlayers = new Set(['html5video', 'mediaelement-video'])

// The frame draws MediaElement's 40-pixel audio bar at any width, over the 30 or 24 PowerPress
// writes on the carrier.
const powerpressAudioHeight = 40

// The video fills the frame's width at 57% of it, and shrinks to 16:9 when the frame is shorter.
const powerpressVideoRatio = '16/9'

export type BlubrryPlayer = { kind: 'episode' | 'media'; id: string }

// Two forms: `/id/{episodeId}/` names the episode, while `/?media_url={mp3}` names the file
// directly. The media url is not promoted to a native <audio>: a provider's player iframe stays
// an embed placeholder, and the raw file is only input for the enrichment hook.
export const extractBlubrryEmbed = (link: string): BlubrryPlayer | undefined => {
  const parsed = parseUrl(link, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  const segments = getPathSegments(parsed)

  if (segments[0] === 'id' && segments[1]) {
    return { kind: 'episode', id: segments[1] }
  }

  const mediaUrl = parsed.searchParams.get('media_url')

  if (!mediaUrl) {
    return
  }

  return { kind: 'media', id: mediaUrl }
}

// Blubrry's player iframe, by episode id or by media url, with no oEmbed to size it.
export const blubrryResolveEmbed: ResolveEmbed = (url, element) => {
  const player = extractBlubrryEmbed(url)

  if (!player) {
    return
  }

  const { kind, id } = player

  return {
    provider,
    id,
    src:
      kind === 'episode'
        ? `https://player.blubrry.com/id/${id}/`
        : `https://player.blubrry.com/?media_url=${encodeURIComponent(id)}`,
    height: playerHeight,
    title: attr(element, 'title'),
  }
}

export const blubrryEmbedResolver = createUrlEmbedResolver(blubrryHosts, blubrryResolveEmbed)

// PowerPress, Blubrry's WordPress plugin, frames an episode from the publisher's own site as
// `{site}/?powerpress_embed={postId}-{feed}`. The post id belongs to that site and maps onto no
// Blubrry player, so the written url passes through.
export const blubrryPowerpressEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="powerpress_embed="]',
  (element) => {
    const link = readCarrierUrl(element)
    const url = parseUrl(link)

    if (!url) {
      return
    }

    const episode = url.searchParams.get('powerpress_embed')

    if (!episode) {
      return
    }

    const isVideo = powerpressVideoPlayers.has(url.searchParams.get('powerpress_player') ?? '')

    return {
      provider,
      // A post id is unique only within its site, so the site travels in the id.
      id: [url.host, ...getPathSegments(url), episode].join('/'),
      src: link,
      height: isVideo ? undefined : powerpressAudioHeight,
      ratio: isVideo ? powerpressVideoRatio : undefined,
      title: attr(element, 'title'),
    }
  },
)

export const blubrryFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Blubrry Podcast Player' },
]

// The player posts no ready message.
export const blubrryRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: -1, // Clicks the player's play button
}
