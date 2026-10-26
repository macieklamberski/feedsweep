import {
  composeQuery,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  parseUrl,
} from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import { filterUrlQuery } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  readRepairedCarrierUrl,
} from '../utils/widgets.js'

const provider = 'blubrry'

const hosts = ['blubrry.com']

const sizes = {
  // The player is 164 tall, one less than the 165 publishers write.
  // A fixed height on a fluid width, and still 164 inside a 100-tall frame.
  player: { height: 164 },
  // The playlist lists ten episodes under the player.
  playlist: { height: 568 },
  // The frame draws MediaElement's 40-pixel audio bar at any width, over the 30 or 24 PowerPress
  // writes on the carrier.
  powerpressAudio: { height: 40 },
  // The video fills the frame's width at 57% of it, and shrinks to 16:9 when the frame is shorter.
  powerpressVideo: { ratio: '16/9' },
}

// The players PowerPress writes into an embed url for a video file, per
// `powerpressplayer_embedable` in its powerpress-player.php. Every other value is an audio player.
const powerpressVideoPlayers = new Set(['html5video', 'mediaelement-video'])

// A show's player follows its newest episode, and its playlist lists the show's episodes.
const showRoutes = ['latest', 'playlist']
// `selectedId` opens the playlist on that episode.
const playlistPositionParams = ['selectedId']

export type BlubrryPlayer =
  | { kind: 'episode' | 'media'; id: string }
  | { kind: 'show'; id: string; route: string; position: string }

// Two forms: `/id/{episodeId}/` names the episode, while `/?media_url={mp3}` names the file
// directly. The media url is not promoted to a native <audio>: a provider's player iframe stays
// an embed placeholder, and the raw file is only input for the enrichment hook.
export const extractBlubrryEmbed = (url: URL): BlubrryPlayer | undefined => {
  const segments = getPathSegments(url)

  if (isAnyOf(segments[0], 'id') && segments[1]) {
    return { kind: 'episode', id: segments[1] }
  }

  const [keyword, route] = segments

  if (segments.length === 2 && keyword && route && isAnyOf(route, showRoutes)) {
    const position = isAnyOf(route, 'playlist')
      ? filterUrlQuery(url, (name) => isAnyOf(name, playlistPositionParams))
      : ''

    return { kind: 'show', id: keyword, route, position }
  }

  // A `podcast_id` beside a media url can name another episode: one feed writes the same id
  // on ten players with ten different mp3s, so the media url wins.
  const mediaUrl = getQueryParam(url.searchParams, 'media_url')

  if (mediaUrl) {
    return { kind: 'media', id: mediaUrl }
  }

  const podcastId = getQueryParam(url.searchParams, 'podcast_id')

  if (!podcastId) {
    return
  }

  return { kind: 'episode', id: encodePathSegment(podcastId) }
}

// Blubrry's player iframe, by episode id, media url or show. The player answers an undocumented
// oEmbed at `?target=oembed&oembed=json` whose height the measurement does not follow.
export const blubrryResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const player = extractBlubrryEmbed(url)

  if (!player) {
    return
  }

  if (player.kind === 'show') {
    const { id, route, position } = player

    return {
      provider,
      id: `${id}/${route}`,
      src: `https://player.blubrry.com/${id}/${route}/${position}`,
      ...(isAnyOf(route, 'playlist') ? sizes.playlist : sizes.player),
      title: attr(element, 'title'),
    }
  }

  const { kind, id } = player

  return {
    provider,
    id,
    src:
      kind === 'episode'
        ? `https://player.blubrry.com/id/${id}/`
        : `https://player.blubrry.com/${composeQuery({ media_url: id })}`,
    ...sizes.player,
    title: attr(element, 'title'),
  }
}

export const blubrryIframeEmbedResolver = createUrlEmbedResolver(hosts, blubrryResolveEmbed)

// PowerPress, Blubrry's WordPress plugin, frames an episode from the publisher's own site as
// `{site}/?powerpress_embed={postId}-{feed}`. The post id belongs to that site and maps onto no
// Blubrry player, so the written url passes through.
export const blubrryPowerpressEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="powerpress_embed=" i]',
  (element) => {
    const link = readRepairedCarrierUrl(element)
    const url = parseUrl(link)

    if (!url) {
      return
    }

    const episode = getQueryParam(url.searchParams, 'powerpress_embed')

    if (!episode) {
      return
    }

    const player = getQueryParam(url.searchParams, 'powerpress_player') ?? ''
    const isVideo = powerpressVideoPlayers.has(player)

    return {
      provider,
      // A post id is unique only within its site, so the site travels in the id.
      id: [url.host, ...getPathSegments(url), episode].join('/'),
      src: link,
      ...(isVideo ? sizes.powerpressVideo : sizes.powerpressAudio),
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
