import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  isHostOrSubdomainOf,
  parseUrl,
} from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, find } from '../utils/dom.js'
import * as styles from '../utils/styles.js'
import { parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  readRepairedCarrierUrl,
} from '../utils/widgets.js'

const provider = 'youtube'

// A Short gets the same landscape player as a film, so a carrier's portrait box never fills.
const sizes = {
  player: { ratio: '16/9' },
}

const safeVideoIdRegex = /^[a-zA-Z0-9_-]{11}$/

// Steam feeds leak a bbcode quote into the src as /embed/"{id}, and the video drops without it.
// The quote reaches the id as a literal `"` from a param or percent-encoded `%22` from a path
// segment.
const strayLeadingQuoteRegex = /^(?:%22|")/

// `videoseries` and `live_stream` are YouTube embed path words, and each is eleven legal id
// characters.
const nonVideoIds = ['videoseries', 'live_stream']

// A url can stack two of these: `/embed/watch?v=` and `/embed/shorts/{id}` are authoring mistakes
// that YouTube answers with a player page which cues nothing, and each still names the video
// after the stack.
const pathWords = [
  'shorts',
  'embed',
  'live',
  'watch',
  'video', // The old share url; redirects to /watch today
  'v', // The Flash player path, shipped in pre-2010 object/embed markup
  'e', // A short-lived embed alias from the same era
  'w', // A watch alias of the same era; still serves the video today
]

const queryIdParams = ['v', 'vi', 'video_id']

// The 2010 AJAX site and the profile grids of the same era kept the video id in the fragment
// (`/watch#!v={id}`, `/user/{name}#p/u/1/{id}`), so the server-side path names no video. The
// links survive in old posts, and the hash still says which video was meant.
const hashbangIdRegex = /^#!vi?=([^&;]+)/i
const gridFragmentIdRegex = /^#p\/.+\/([0-9A-Za-z_-]{11})$/i

// `youtube.googleapis.com/v/{id}` is the Flash player's other host, still shipped by Blogger
// feeds of that era.
export const hosts = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'youtube.googleapis.com']

// A bare id, already separated from any url: the right shape, and not one of the embed path
// words that share it.
export const isVideoId = (value: string): boolean => {
  return safeVideoIdRegex.test(value) && !isAnyOf(value, nonVideoIds)
}

// hqdefault exists for every video, and maxresdefault and sddefault only for some.
// TODO: prefer a higher-res thumbnail where one exists, which needs a HEAD probe per video.
export const composeThumbnailUrl = (videoId: string): string => {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

// The player url every transform that recovers an id has to build. Params are given as values,
// not as a ready query string, so they get encoded here, and one carrying an `&` cannot open a
// parameter of its own.
export const composeEmbedUrl = (videoId: string, params?: Record<string, string>): string => {
  const query = composeQuery(params)

  return `https://www.youtube.com/embed/${videoId}${query}`
}

const readPathId = (url: URL): string | undefined => {
  const segments = getPathSegments(url)

  if (isHostOrSubdomainOf(url, 'youtu.be')) {
    const [videoId] = segments

    return videoId
  }

  const [route] = segments

  // A path opening with no route word names no video: a bare vanity channel url would otherwise
  // read as one whenever the name happens to be eleven legal characters.
  if (!isAnyOf(route, pathWords)) {
    return
  }

  return segments.find((segment) => !isAnyOf(segment, pathWords))
}

export const extractVideoId = (url: URL | undefined): string | undefined => {
  if (!url) {
    return
  }

  const candidates = [
    readPathId(url),
    ...queryIdParams.map((param) => getQueryParam(url.searchParams, param)),
    url.hash.match(hashbangIdRegex)?.[1],
    url.hash.match(gridFragmentIdRegex)?.[1],
  ]

  return candidates
    .map((candidate) => candidate?.replace(strayLeadingQuoteRegex, ''))
    .find((candidate) => !!candidate && isVideoId(candidate))
}

// A clip embed needs both `clip` and `clipt`, and `loop` does nothing without `playlist`, which in
// the wild is almost always the video's own id: YouTube's documented way to loop a single video.
export const youtubeEmbedParams = [
  'start',
  'end',
  'list',
  'index',
  'clip',
  'clipt',
  'playlist',
  'loop',
]

// A watch or share link spells its start offset as `t`: `90`, `90s`, `1m30s` or `1h2m3s`.
const watchOffsetRegex = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i

// The clock spelling some publishers write in a fragment: `24:09` or `1:02:03`.
const clockOffsetRegex = /^(?:(\d+):)?(\d+):(\d+)$/

const parseWatchOffset = (value: string): string | undefined => {
  const match = watchOffsetRegex.exec(value) ?? clockOffsetRegex.exec(value)

  if (!match?.[0]) {
    return
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = match

  return String(Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds))
}

// The player ignores `t`, so an offset moves over as `start` unless one is stated. Besides the
// query, publishers write it in the fragment as `#t=220`.
const readEmbedParams = (url: URL): Record<string, string> => {
  const params = pickQueryParams(url.search, youtubeEmbedParams)

  if (params.start) {
    return params
  }

  const offsetQueries = [url.search, url.hash.slice(1)]
  const start = offsetQueries
    .map((query) => {
      const offset = getQueryParam(new URLSearchParams(query), 't') ?? ''

      return parseWatchOffset(offset)
    })
    .find(Boolean)

  if (start) {
    params.start = start
  }

  return params
}

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
export const readYoutubeEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, hosts)

  if (!url) {
    return
  }

  const videoId = extractVideoId(url)

  if (!videoId) {
    return
  }

  return composeEmbedUrl(videoId, readEmbedParams(url))
}

// `PBS` is a legal playlist id, channel id and legacy username at once, so each key names its
// route. A playlist resolves title and poster through YouTube's keyless oEmbed, a channel through
// the Data API.
const composeListEmbed = (list: string): EmbedResolverResult => {
  return {
    provider,
    id: `playlist/${list}`,
    src: composeEmbedUrl('videoseries', { list }),
    url: `https://www.youtube.com/playlist${composeQuery({ list })}`,
    ...sizes.player,
  }
}

// `listType=user_uploads` takes a legacy username in place of a playlist id.
const composeUploadsEmbed = (user: string): EmbedResolverResult => {
  return {
    provider,
    id: `user/${user}`,
    src: `https://www.youtube.com/embed${composeQuery({ listType: 'user_uploads', list: user })}`,
    // The username comes out of the query decoded, and it goes into a path.
    url: `https://www.youtube.com/user/${encodePathSegment(user)}`,
    ...sizes.player,
  }
}

const composeVideoEmbed = (
  videoId: string,
  params?: Record<string, string>,
): EmbedResolverResult => {
  // An attribute or query id comes out decoded, and it goes into the player and poster paths.
  const segment = encodePathSegment(videoId)

  return {
    provider,
    id: videoId,
    src: composeEmbedUrl(segment, params),
    url: `https://www.youtube.com/watch${composeQuery({ v: videoId })}`,
    thumbnail: composeThumbnailUrl(segment),
    ...sizes.player,
  }
}

// AMP's attribute and the query value both come out decoded, and the channel goes into a path.
const composeChannelEmbed = (channel: string): EmbedResolverResult => {
  const segment = encodePathSegment(channel)

  return {
    provider,
    id: `channel/${channel}`,
    src: composeEmbedUrl('live_stream', { channel }),
    url: `https://www.youtube.com/channel/${segment}`,
    ...sizes.player,
  }
}

const resolveCollectionEmbed = (
  parsed: URL,
  segments: Array<string>,
): EmbedResolverResult | undefined => {
  const listType = getQueryParam(parsed.searchParams, 'listType')
  const list = getQueryParam(parsed.searchParams, 'list')
  const channel = getQueryParam(parsed.searchParams, 'channel')
  const [, routeTarget] = segments

  if (isAnyOf(routeTarget, 'live_stream')) {
    if (!channel) {
      return
    }

    return composeChannelEmbed(channel)
  }

  // `/embed/videoseries?list=`, `/embed/playlist?list=` and the bare `/embed/?list=` some
  // WordPress plugins emit are the same playlist spelled three ways.
  if (!isAnyOf(routeTarget, ['videoseries', 'playlist']) && segments.length !== 1) {
    return
  }

  // `listType=search` named a search query, not an id, and YouTube removed it in 2020: the
  // embed plays nothing and there is nothing to resolve it to.
  if (isAnyOf(listType, 'search') || !list) {
    return
  }

  return isAnyOf(listType, 'user_uploads') ? composeUploadsEmbed(list) : composeListEmbed(list)
}

const resolveTarget = (url: URL): EmbedResolverResult | undefined => {
  const segments = getPathSegments(url)
  const [route, routeTarget] = segments

  if (isAnyOf(route, 'embed')) {
    const embed = resolveCollectionEmbed(url, segments)

    // A `/embed/{id}` path names a video and falls through; the rest of the embed paths name
    // their content here or name nothing resolvable.
    if (embed || segments.length === 1 || isAnyOf(routeTarget, nonVideoIds)) {
      return embed
    }
  }

  // The playlist page refuses framing, so a frame of it shows nothing, and its `list` is the id
  // the playlist player takes.
  if (isAnyOf(route, 'playlist')) {
    const list = getQueryParam(url.searchParams, 'list')

    if (!list) {
      return
    }

    return composeListEmbed(list)
  }

  // The Flash player took its playlist on `/p/{id}`, the playlist the modern url spells as
  // `list=PL{id}`, and the swf it points at is dead, so the id is the only thing left to rebuild
  // from. The publisher's `?hl=` and `&fs=1` are player chrome and go with the rest of the query.
  if (isAnyOf(route, 'p')) {
    const head = routeTarget ?? ''
    // The id moves from a path segment into the query, so it is decoded first.
    const list = decodeSegment(head) ?? head

    if (!list) {
      return
    }

    return composeListEmbed(`PL${list}`)
  }

  const videoId = extractVideoId(url)

  if (!videoId) {
    return
  }

  return composeVideoEmbed(videoId, readEmbedParams(url))
}

export const youtubeResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const target = resolveTarget(url)

  if (!target) {
    return
  }

  return {
    ...target,
    title: attr(element, 'title'),
  }
}

// FC2's blog player shell on static.fc2.com, a page that builds only the YouTube player its query
// `id` names. The generic iframe placeholder for it carries no provider and no poster.
export const youtubeFc2EmbedResolver = createUrlEmbedResolver(
  ['static.fc2.com'],
  (url, element) => {
    if (!isAnyOf(url.pathname, '/misc/blog/view/ext_youtube_player.html')) {
      return
    }

    // FC2's iframe snippet also carries the id as `data-id`, which the shell never reads.
    const videoId = [getQueryParam(url.searchParams, 'id'), attr(element, 'data-id')].find(Boolean)

    if (!videoId) {
      return
    }

    const title = getQueryParam(url.searchParams, 'title')

    return {
      ...composeVideoEmbed(videoId),
      // The shell draws no title when the query `title` is the string "undefined".
      title: title && title !== 'undefined' ? title : undefined,
    }
  },
)

// A YouTube player iframe, a frame of a watch, shorts or playlist page, or the Flash player.
export const youtubeIframeEmbedResolver = createUrlEmbedResolver(hosts, youtubeResolveEmbed)

// Invidious and Piped instances run on any host and serve YouTube's own `/embed` route for the
// same ids. An instance host opens on its software's name, and Invidious's share snippet names
// its frame `ivplayer` on any host.
const frontendLabels = ['invidious', 'piped']

// Invidious instances whose host carries neither name.
const instanceHosts = ['invidio.us', 'yewtu.be', 'inv.nadeko.net', 'inv.riverside.rocks']

// Both front ends read the start from `t` before `start`, and Invidious from `time_continue`
// between them, each as seconds or as `1m30s`.
const frontendOffsetParams = ['t', 'time_continue']

const isFrontendFrame = (url: URL, element: Element): boolean => {
  const [label] = url.hostname.split('.')

  return (
    frontendLabels.includes(label) ||
    isHostOrSubdomainOf(url, instanceHosts) ||
    isAnyOf(attr(element, 'id'), 'ivplayer')
  )
}

// An Invidious or Piped frame: the instance's player for a YouTube id, mostly on instances that
// are gone.
export const youtubeFrontendEmbedResolver = createMarkupEmbedResolver(
  'iframe[src*="/embed/" i]',
  (element) => {
    const url = parseUrl(readRepairedCarrierUrl(element))

    if (!url || !isFrontendFrame(url, element)) {
      return
    }

    const params = pickQueryParams(url.search, youtubeEmbedParams)
    const offset = frontendOffsetParams
      .map((name) => getQueryParam(url.searchParams, name))
      .find(Boolean)
    const start = parseWatchOffset(offset ?? '')

    if (start) {
      params.start = start
    }

    const youtubeUrl = new URL(`${url.pathname}${composeQuery(params)}`, 'https://www.youtube.com')

    return youtubeResolveEmbed(youtubeUrl, element)
  },
)

// AMP's amp-youtube names the video in data-videoid and renders nothing without the AMP runtime.
export const youtubeAmpEmbedResolver = createMarkupEmbedResolver(
  'amp-youtube[data-videoid], amp-youtube[data-live-channelid]',
  (element) => {
    const videoId = attr(element, 'data-videoid')

    // `data-live-channelid` is AMP's spelling of the channel live embed, and the element states
    // one or the other.
    if (!videoId) {
      const channel = attr(element, 'data-live-channelid')

      if (!channel) {
        return
      }

      return composeChannelEmbed(channel)
    }

    // `videoseries` and `live_stream` are route words that sit where a video id does.
    if (isAnyOf(videoId, nonVideoIds)) {
      return
    }

    const params: Record<string, string> = {}

    // AMP hands player parameters to the iframe as `data-param-{name}`, which are the same query
    // parameters an ordinary embed url spells.
    for (const name of youtubeEmbedParams) {
      const value = attr(element, `data-param-${name}`)

      if (value) {
        params[name] = value
      }
    }

    return composeVideoEmbed(videoId, params)
  },
)

// MetaSlider Pro's YouTube slide: an empty div that only the plugin's script builds into a player.
export const youtubeMetasliderEmbedResolver = createMarkupEmbedResolver(
  'li.ms-youtube div.youtube[data-id]',
  (element) => {
    const videoId = attr(element, 'data-id')

    if (!videoId) {
      return
    }

    // The plugin hands `data-start` to the player as its `start` parameter.
    const start = attr(element, 'data-start')

    return {
      ...composeVideoEmbed(videoId, start ? { start } : undefined),
      // A lazy slide's poster carries the video's title as its `alt`.
      title: attr(find(element, 'img.msDefaultImage'), 'alt'),
    }
  },
)

// The poster of a video, `i.ytimg.com/vi/{id}/hqdefault.jpg`, or its WebP copy under `vi_webp`.
const thumbnailRoutes = ['vi', 'vi_webp']

const readThumbnailVideoId = (link: string | undefined): string | undefined => {
  const url = parseUrlOnHosts(link, 'i.ytimg.com')

  if (!url) {
    return
  }

  const [route, videoId] = getPathSegments(url)

  if (!isAnyOf(route, thumbnailRoutes)) {
    return
  }

  return videoId
}

// react-lite-youtube-embed's facade, `article.yt-lite` with the poster as its background, builds
// the player only on click. Publishers' own copies of it name the id in a data attribute.
export const youtubeLiteEmbedResolver = createMarkupEmbedResolver(
  // A playlist facade's poster names only its cover video.
  '.yt-lite:not(:has(iframe, .lty-playlist-icon))',
  (element) => {
    const videoId =
      attr(element, 'data-video-id') ??
      attr(element, 'data-id') ??
      readThumbnailVideoId(styles.bgImage(element))

    if (!videoId) {
      return
    }

    const embed = composeVideoEmbed(videoId)

    return {
      ...embed,
      // A publisher copy of the facade paints its own poster, which can be another picture.
      thumbnail: attr(find(element, 'img'), 'src') ?? embed.thumbnail,
      title: attr(element, 'data-title'),
    }
  },
)

export const youtubeFieldCleaners: Array<FieldCleaner> = [
  {
    provider,
    field: 'title',
    drop: /^(?:embedded )?youtube (?:video player|video|player|short)(?: \d+)?$/,
  },
  // The AllVideos Joomla plugin.
  { provider, field: 'title', drop: 'JoomlaWorks AllVideos Player' },
]

// What a reader appends to start playback on the click that loads the player.
export const youtubeRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1', enablejsapi: '1' },
}
