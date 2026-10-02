import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'

const provider = 'blubrry'

import { placeholderBaseUrl } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// PowerPress, Blubrry's WordPress plugin, renders the same player on the publisher's own domain
// as `{site}/?powerpress_embed={postId}-{feed}`, with no Blubrry host in the url at all.
const blubrryHosts = ['blubrry.com']

// The player is 164 tall, one less than the 165 publishers write.
// A fixed height on a fluid width, and still 164 inside a 100-tall frame.
const playerHeight = 164

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

export const blubrryFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Blubrry Podcast Player' },
]

// The player posts no ready message.
export const blubrryRenderHint: EmbedRenderHint = {
  provider,
  requestPlay: -1, // Clicks the player's play button
}
