import {
  decodeSegment,
  getPathSegments,
  isPlainObject,
  type Nullish,
  parseUrl,
  trimObject,
} from 'trousse'
import type { EmbedRenderHint, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'

const provider = 'dailymotion'

import {
  composeQuery,
  encodePathSegment,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
  splitStrayParams,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// Listed one by one: `dailymotion.de` is third-party, and a tld pattern would trust it.
// Each apex redirects to a language landing page, dropping the video.
const dailymotionHosts = [
  'dailymotion.com',
  'dailymotion.co.uk',
  'dailymotion.es',
  'dailymotion.fr',
  'dailymotion.it',
  'dai.ly',
]

// The Flash player shipped `/swf/{id}` and `/swf/video/{id}`, which stacks two route words.
const pathWords = new Set(['embed', 'video', 'swf'])

// `/embed/{locale}/video/{id}` serves the player and redirects to
// `geo.dailymotion.com/player.html?video={id}`.
const localeRegex = /^[a-z]{2}$/

// Kinds Dailymotion's embed route serves besides a video: each reaches the player with an empty
// `video=` or redirects to a page, so the segment names a listing or a landing page.
const nonVideoWords = new Set([
  'playlist',
  'user',
  'channel',
  'group',
  'tag',
  'search',
  'topic',
  'collection',
  'feed',
  'videos',
  'live',
])

const isRouteWord = (segment: string): boolean => {
  return pathWords.has(segment) || nonVideoWords.has(segment)
}

const skipRouteWords = (segments: Array<string>): number => {
  let index = 0

  while (
    index < segments.length &&
    (pathWords.has(segments[index]) ||
      (localeRegex.test(segments[index]) && isRouteWord(segments[index + 1])))
  ) {
    index++
  }

  return index
}

// Share urls append a `_title-slug` to the id and the platform strips it itself. The Flash player
// wrote `/swf/{id}&colors=…`, so a stray query rides on the segment too.
const readId = (candidate: Nullish<string>): string | undefined => {
  if (!candidate) {
    return
  }

  return splitStrayParams(candidate).head.split('_')[0]
}

const wallWords = ['videowall', 'videozap']
const playableWords = ['vids', 'playlist']

// The retired widgets name what they play after a kind word: the jukebox in its `list[]`
// entries, `/vids/{id}+{id}` or `/playlist/{id}_{slug}/{page}`, and the video wall and videozap in
// the path, `/videowall/playlist/{id}_{slug}&cols=4`. Every one of them now refuses framing.
const readWidgetEntry = (url: URL): Array<string> => {
  const segments = getPathSegments(url)

  if (segments[0] === 'widget' && segments[1] === 'jukebox') {
    // A jukebox can list a user or a group beside a playlist, and only a video or a playlist maps
    // onto a player.
    const entries = url.searchParams.getAll('list[]').map((entry) => {
      return entry.split('/').filter(Boolean)
    })

    return entries.find(([kind]) => playableWords.includes(kind)) ?? []
  }

  if (wallWords.includes(segments[0])) {
    return segments.slice(1)
  }

  return []
}

// A playlist names no single video, so it is read separately and only once the video readers have
// found nothing: `/embed/video/{id}?playlist={id}` is a video playing inside one, not a playlist.
const extractDailymotionPlaylistId = (link: string): string | undefined => {
  const url = parseUrl(link, placeholderBaseUrl)

  if (!url) {
    return
  }

  const segments = getPathSegments(url)
  const marker = skipRouteWords(segments)

  const pathId = segments[marker] === 'playlist' ? segments[marker + 1] : undefined
  // The path id is decoded here, like the query one, so the url and the player encode it once.
  const candidate = pathId ? (decodeSegment(pathId) ?? pathId) : url.searchParams.get('playlist')
  const [kind, widgetId] = readWidgetEntry(url)

  return [candidate, kind === 'playlist' ? widgetId : undefined].map(readId).find(Boolean)
}

const readPathId = (url: URL, segments: Array<string>): string | undefined => {
  // The short domain is a pure shortener with no routes of its own: every path it does not know
  // as a video goes to `/urlshortener?path=…`, so nothing there needs telling from an id.
  if (url.hostname === 'dai.ly' || url.hostname.endsWith('.dai.ly')) {
    return segments[0] && (decodeSegment(segments[0]) ?? segments[0])
  }

  const index = skipRouteWords(segments)

  // A path opening with no route word names no video. Site pages would otherwise read as one:
  // `/about` is five legal id characters.
  const candidate = index > 0 ? segments[index] : undefined

  if (!candidate || nonVideoWords.has(candidate)) {
    return
  }

  // Decoded here, so the url, the thumbnail and the player encode it once.
  return decodeSegment(candidate) ?? candidate
}

export const extractDailymotionId = (link: string): string | undefined => {
  const url = parseUrl(link, placeholderBaseUrl)

  if (!url) {
    return
  }

  const [kind, widgetIds] = readWidgetEntry(url)
  // The jukebox joins its videos with `+`, which the query decodes to a space.
  const widgetId = kind === 'vids' ? widgetIds?.split(' ')[0] : undefined

  // A path naming no video still leaves the geo player's `video` parameter to be read.
  return [readPathId(url, getPathSegments(url)), url.searchParams.get('video'), widgetId]
    .map(readId)
    .find(Boolean)
}

// The generic player, `www.dailymotion.com/embed/...` and the `geo.dailymotion.com/player.html` it
// redirects to, answers 403 to a site off Dailymotion's allowlist. A player id plays anywhere, and
// `xpiw2` is the one in Dailymotion's own documentation.
const playerId = 'xpiw2'

export const composeEmbedUrl = (
  route: 'video' | 'playlist',
  id: string,
  params: Record<string, string> = {},
): string => {
  return `https://geo.dailymotion.com/player/${playerId}.html${composeQuery({ [route]: id, ...params })}`
}

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
export const readDailymotionEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, dailymotionHosts)
  const videoId = url && extractDailymotionId(url.href)

  return videoId ? composeEmbedUrl('video', videoId) : undefined
}

// Where playback starts, whether it loops, and the playlist the video sits in. The rest of the
// publisher's query is dropped with the rebuilt src.
// Neither player reads `autoplay` off the query: autostart comes from the saved configuration.
const dailymotionEmbedParams = ['start', 'startTime', 'loop', 'playlist']

// A player id's player reads the start as `startTime` and ignores the old `start`.
const readPlayerParams = (url: string): Record<string, string> => {
  const params = pickQueryParams(parseUrl(url)?.search ?? '', dailymotionEmbedParams)

  return {
    ...trimObject(
      { loop: params.loop, playlist: params.playlist, startTime: params.startTime ?? params.start },
      Boolean,
    ),
  }
}

export const dailymotionResolveEmbed: ResolveEmbed = (url, element) => {
  const videoId = extractDailymotionId(url)

  if (videoId) {
    // The geo player's `video` comes out of the query decoded, and it goes into two paths.
    const segment = encodePathSegment(videoId)

    return {
      provider,
      id: videoId,
      src: composeEmbedUrl('video', videoId, readPlayerParams(url)),
      url: `https://www.dailymotion.com/video/${segment}`,
      thumbnail: `https://www.dailymotion.com/thumbnail/video/${segment}`,
      ratio: '16/9',
      title: attr(element, 'title'),
    }
  }

  const playlistId = extractDailymotionPlaylistId(url)

  if (playlistId) {
    // The id is qualified because a playlist and a video share one id grammar, and what reaches
    // an enrichment pass is the provider and the id alone. No thumbnail comes with it:
    // `/thumbnail/playlist/{id}` answers 404, and the video endpoint answers about a video.
    return {
      provider,
      id: `playlist/${playlistId}`,
      src: composeEmbedUrl('playlist', playlistId),
      // The `playlist` parameter comes out of the query decoded, and it goes into a path.
      url: `https://www.dailymotion.com/playlist/${encodePathSegment(playlistId)}`,
      ratio: '16/9',
      title: attr(element, 'title'),
    }
  }
}

// Dailymotion's player iframe for a video or a playlist, on its country hosts and dai.ly too.
export const dailymotionEmbedResolver = createUrlEmbedResolver(
  dailymotionHosts,
  dailymotionResolveEmbed,
)

export const dailymotionFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Dailymotion Video Player' },
  { provider, field: 'title', drop: 'Lecteur vidéo Dailymotion' },
  { provider, field: 'title', drop: 'Powered by Dailymotion' },
  { provider, field: 'title', strip: 'Dailymotion video player – ' },
]

// The player opens its message channel only when `window.name` holds the `dmInternalData` JSON
// Dailymotion's embed library writes there, and every event it posts carries `iframeId` as `id`.
const iframeId = 'dm1'

const isDailymotionReady = (data: unknown): boolean => {
  if (typeof data !== 'string') {
    return false
  }

  try {
    const message: unknown = JSON.parse(data)

    return isPlainObject(message) && message.event === 'apiready' && message.id === iframeId
  } catch {
    return false
  }
}

export const dailymotionRenderHint: EmbedRenderHint = {
  provider,
  frameName: encodeURIComponent(JSON.stringify({ dmInternalData: { iframeId } })),
  isReady: isDailymotionReady,
  requestPlay: { command: 'play' },
}
