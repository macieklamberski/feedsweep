import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  getQueryParams,
  getQueryParamValues,
  isAnyOf,
  isHostOrSubdomainOf,
  isPlainObject,
  isString,
  type Nullish,
  trimObject,
} from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, find } from '../utils/dom.js'
import { parseUrlOnHosts, twoLettersRegex } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'dailymotion'

const sizes = {
  video: { ratio: '16/9' },
  playlist: { ratio: '16/9' },
}

// Listed one by one: `dailymotion.de` is third-party, and a tld pattern would trust it.
// Each apex redirects to a language landing page, dropping the video.
export const hosts = [
  'dailymotion.com',
  'dailymotion.co.uk',
  'dailymotion.es',
  'dailymotion.fr',
  'dailymotion.it',
  'dai.ly',
]

// The Flash player shipped `/swf/{id}` and `/swf/video/{id}`, which stacks two route words.
const pathWords = ['embed', 'video', 'swf']

// Kinds Dailymotion's embed route serves besides a video: each reaches the player with an empty
// `video=` or redirects to a page, so the segment names a listing or a landing page.
const nonVideoWords = [
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
]

const isRouteWord = (segment: string): boolean => {
  return isAnyOf(segment, pathWords) || isAnyOf(segment, nonVideoWords)
}

// The segments after the route words the path opens with.
const skipRouteWords = (segments: Array<string>): Array<string> => {
  let rest = segments

  // `/embed/{locale}/video/{id}` serves the player and redirects to
  // `geo.dailymotion.com/player.html?video={id}`. Two letters tell a locale from an account
  // handle, since account pages also open the path.
  while (rest.length > 0) {
    const [word, nextWord] = rest

    if (!isAnyOf(word, pathWords) && !(twoLettersRegex.test(word) && isRouteWord(nextWord))) {
      break
    }

    rest = rest.slice(1)
  }

  return rest
}

// Share urls append a `_title-slug` to the id and the platform strips it itself.
const readId = (candidate: Nullish<string>): string | undefined => {
  if (!candidate) {
    return
  }

  return candidate.split('_')[0]
}

const wallWords = ['videowall', 'videozap']
const playableWords = ['vids', 'playlist']

// The retired widgets name what they play after a kind word: the jukebox in its `list[]`
// entries, `/vids/{id}+{id}` or `/playlist/{id}_{slug}/{page}`, and the video wall and videozap in
// the path, `/videowall/playlist/{id}_{slug}&cols=4`. Every one of them now refuses framing.
const readWidgetEntry = (url: URL): Array<string> => {
  const segments = getPathSegments(url)
  const [route, widgetKind] = segments

  if (isAnyOf(route, 'widget') && isAnyOf(widgetKind, 'jukebox')) {
    // A jukebox can list a user or a group beside a playlist, and only a video or a playlist maps
    // onto a player.
    const entries = getQueryParamValues(url.searchParams, 'list[]').map((entry) => {
      return entry.split('/').filter(Boolean)
    })

    return entries.find(([kind]) => isAnyOf(kind, playableWords)) ?? []
  }

  if (isAnyOf(route, wallWords)) {
    return segments.slice(1)
  }

  return []
}

// A playlist names no single video, so it is read separately and only once the video readers have
// found nothing: `/embed/video/{id}?playlist={id}` is a video playing inside one, not a playlist.
const extractDailymotionPlaylistId = (url: URL): string | undefined => {
  const segments = getPathSegments(url)
  const [route, playlistId] = skipRouteWords(segments)

  const pathId = isAnyOf(route, 'playlist') ? playlistId : undefined
  // The path id is decoded here, like the query one, so the url and the player encode it once.
  const candidate = pathId
    ? (decodeSegment(pathId) ?? pathId)
    : getQueryParam(url.searchParams, 'playlist')
  const [kind, widgetId] = readWidgetEntry(url)

  return [candidate, isAnyOf(kind, 'playlist') ? widgetId : undefined].map(readId).find(Boolean)
}

const readPathId = (url: URL, segments: Array<string>): string | undefined => {
  // The short domain is a pure shortener with no routes of its own: every path it does not know
  // as a video goes to `/urlshortener?path=…`, so nothing there needs telling from an id.
  if (isHostOrSubdomainOf(url, 'dai.ly')) {
    const [shortId] = segments

    return shortId && (decodeSegment(shortId) ?? shortId)
  }

  const rest = skipRouteWords(segments)
  const [pathId] = rest

  // A path opening with no route word names no video. Site pages would otherwise read as one:
  // `/about` is five legal id characters.
  const candidate = rest.length < segments.length ? pathId : undefined

  if (!candidate || isAnyOf(candidate, nonVideoWords)) {
    return
  }

  // Decoded here, so the url, the thumbnail and the player encode it once.
  return decodeSegment(candidate) ?? candidate
}

export const extractDailymotionId = (url: URL): string | undefined => {
  const [kind, widgetIds] = readWidgetEntry(url)
  // The jukebox joins its videos with `+`, which the query decodes to a space.
  const widgetId = isAnyOf(kind, 'vids') ? widgetIds?.split(' ')[0] : undefined

  // A path naming no video still leaves the geo player's `video` parameter to be read.
  return [readPathId(url, getPathSegments(url)), getQueryParam(url.searchParams, 'video'), widgetId]
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

// Where playback starts, whether it loops, and the playlist the video sits in. The rest of the
// publisher's query is dropped with the rebuilt src.
// Neither player reads `autoplay` off the query: autostart comes from the saved configuration.
const dailymotionEmbedParams = ['start', 'startTime', 'loop', 'playlist']

// A player id's player reads the start as `startTime` and ignores the old `start`.
const readPlayerParams = (url: URL): Record<string, string> => {
  const params = getQueryParams(url.search, dailymotionEmbedParams)

  return {
    ...trimObject(
      { loop: params.loop, playlist: params.playlist, startTime: params.startTime ?? params.start },
      Boolean,
    ),
  }
}

export const dailymotionResolveEmbed: ResolveUrlEmbed = (url, element) => {
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
      ...sizes.video,
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
      ...sizes.playlist,
      title: attr(element, 'title'),
    }
  }
}

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
// It reads the url the way the resolver does, playlists and start times included.
export const readDailymotionEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, hosts)

  if (!url) {
    return
  }

  return dailymotionResolveEmbed(url)?.src
}

// Dailymotion's player iframe for a video or a playlist, on its country hosts and dai.ly too.
export const dailymotionIframeEmbedResolver = createUrlEmbedResolver(hosts, dailymotionResolveEmbed)

// The Library Script under `/libs/player/` takes no item from its tag.
const playerScriptPathRegex = /^\/player\/[^/]+\.js$/i
// Dailymotion writes the duration in seconds alone.
const durationRegex = /^P(\d+)S$/

// The snippet Dailymotion hands out wraps the script in schema.org microdata about the item.
const readSnippetFields = (
  element: Element,
  result: EmbedResolverResult,
): Partial<EmbedResolverResult> | undefined => {
  const readMeta = (name: string): string | undefined => {
    return attr(find(element.parentElement, `meta[itemprop="${name}"]`), 'content')
  }

  const embedUrl = parseUrlOnHosts(readMeta('embedUrl'), hosts)

  if (!embedUrl || dailymotionResolveEmbed(embedUrl)?.id !== result.id) {
    return
  }

  const seconds = readMeta('duration')?.match(durationRegex)?.[1]

  return {
    title: readMeta('name'),
    description: readMeta('description'),
    date: readMeta('uploadDate'),
    duration: seconds ? Number(seconds) : undefined,
  }
}

// Dailymotion's Player Embed Script, `geo.dailymotion.com/player/{playerId}.js` naming the item in
// `data-video` or `data-playlist`, which renders nothing until it runs.
export const dailymotionScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="dailymotion.com/" i][data-video], script[src*="dailymotion.com/" i][data-playlist]',
  (element) => {
    const loader = parseUrlOnHosts(attr(element, 'src'), hosts)

    if (!loader || !playerScriptPathRegex.test(loader.pathname)) {
      return
    }

    const query = composeQuery(
      trimObject({ video: attr(element, 'data-video'), playlist: attr(element, 'data-playlist') }),
    )
    // The script writes its player's iframe with the same query.
    const result = dailymotionResolveEmbed(
      new URL(`https://geo.dailymotion.com/player.html${query}`),
    )

    if (!result) {
      return
    }

    return {
      ...result,
      ...readSnippetFields(element, result),
    }
  },
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
  if (!isString(data)) {
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
