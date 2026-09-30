import { decodeSegment, getPathSegments, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr } from '../utils/dom.js'
import {
  composeQuery,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
  splitStrayParams,
} from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'youtube'

const safeVideoIdRegex = /^[a-zA-Z0-9_-]{11}$/

// Steam feeds leak a bbcode quote into the src as /embed/"{id}, and the video drops without it.
// The quote reaches the id as a literal `"` from a param or percent-encoded `%22` from a path
// segment.
const strayLeadingQuoteRegex = /^(?:%22|")/

// `videoseries` and `live_stream` are YouTube embed path words, and each is eleven legal id
// characters.
const nonVideoIds = new Set(['videoseries', 'live_stream'])

// A url can stack two of these: `/embed/watch?v=` and `/embed/shorts/{id}` are authoring mistakes
// that YouTube answers with a player page which cues nothing, and each still names the video
// after the stack.
const pathWords = new Set([
  'shorts',
  'embed',
  'live',
  'watch',
  'video', // The old share url; redirects to /watch today
  'v', // The Flash player path, shipped in pre-2010 object/embed markup
  'e', // A short-lived embed alias from the same era
  'w', // A watch alias of the same era; still serves the video today
])

const queryIdParams = ['v', 'vi', 'video_id']

// The 2010 AJAX site and the profile grids of the same era kept the video id in the fragment
// (`/watch#!v={id}`, `/user/{name}#p/u/1/{id}`), so the server-side path names no video. The
// links survive in old posts, and the hash still says which video was meant.
const hashbangIdRegex = /^#!vi?=([^&;]+)/
const gridFragmentIdRegex = /^#p\/.+\/([0-9A-Za-z_-]{11})$/

// `youtube.googleapis.com/v/{id}` is the Flash player's other host, still shipped by Blogger
// feeds of that era.
const youtubeHosts = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'youtube.googleapis.com']

// A bare id, already separated from any url: the right shape, and not one of the embed path
// words that share it.
export const isVideoId = (value: string): boolean => {
  return safeVideoIdRegex.test(value) && !nonVideoIds.has(value)
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

  if (url.hostname === 'youtu.be' || url.hostname.endsWith('.youtu.be')) {
    return segments[0]
  }

  let index = 0

  while (index < segments.length && pathWords.has(segments[index])) {
    index++
  }

  // A path opening with no route word names no video: a bare vanity channel url would otherwise
  // read as one whenever the name happens to be eleven legal characters.
  return index > 0 ? segments[index] : undefined
}

export const extractVideoId = (link: string): string | undefined => {
  const url = parseUrl(link, placeholderBaseUrl)

  if (!url) {
    return
  }

  const candidates = [
    readPathId(url),
    ...queryIdParams.map((param) => url.searchParams.get(param)),
    url.hash.match(hashbangIdRegex)?.[1],
    url.hash.match(gridFragmentIdRegex)?.[1],
  ]

  // The Flash player wrote `/v/{id}&hl=en_US&fs=1`, so the id is the segment's head.
  return candidates
    .map((candidate) =>
      candidate ? splitStrayParams(candidate.replace(strayLeadingQuoteRegex, '')).head : undefined,
    )
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
const watchOffsetRegex = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/

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
// query, the Flash-era spelling left it in the path as `/embed/{id}&t=6s`, and publishers write it
// in the fragment as `#t=220`.
const readEmbedParams = (url: string): Record<string, string> => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const params = pickQueryParams(parsed?.search ?? '', youtubeEmbedParams)

  if (!parsed || params.start) {
    return params
  }

  const offsetQueries = [
    parsed.search,
    splitStrayParams(parsed.pathname).strayParams,
    parsed.hash.slice(1),
  ]
  const start = offsetQueries
    .map((query) => parseWatchOffset(new URLSearchParams(query).get('t') ?? ''))
    .find(Boolean)

  if (start) {
    params.start = start
  }

  return params
}

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
export const readYoutubeEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, youtubeHosts)

  if (!url) {
    return
  }

  const videoId = extractVideoId(url.href)

  if (!videoId) {
    return
  }

  return composeEmbedUrl(videoId, readEmbedParams(url.href))
}

// A Short gets the same landscape player as a film, so a carrier's portrait box never fills.
const playerRatio = '16/9'

// `PBS` is a legal playlist id, channel id and legacy username at once, so each key names its
// route. A playlist resolves title and poster through YouTube's keyless oEmbed, a channel through
// the Data API.
const composeListEmbed = (list: string): EmbedResolverResult => {
  return {
    provider,
    id: `playlist/${list}`,
    src: composeEmbedUrl('videoseries', { list }),
    url: `https://www.youtube.com/playlist${composeQuery({ list })}`,
    ratio: playerRatio,
  }
}

// `listType=user_uploads` takes a legacy username in place of a playlist id.
const composeUploadsEmbed = (user: string): EmbedResolverResult => {
  return {
    provider,
    id: `user/${user}`,
    src: `https://www.youtube.com/embed${composeQuery({ listType: 'user_uploads', list: user })}`,
    url: `https://www.youtube.com/user/${user}`,
    ratio: playerRatio,
  }
}

const composeVideoEmbed = (
  videoId: string,
  params?: Record<string, string>,
): EmbedResolverResult => {
  return {
    provider,
    id: videoId,
    src: composeEmbedUrl(videoId, params),
    url: `https://www.youtube.com/watch${composeQuery({ v: videoId })}`,
    thumbnail: composeThumbnailUrl(videoId),
    ratio: playerRatio,
  }
}

const composeChannelEmbed = (channel: string): EmbedResolverResult => {
  return {
    provider,
    id: `channel/${channel}`,
    src: composeEmbedUrl('live_stream', { channel }),
    url: `https://www.youtube.com/channel/${channel}`,
    ratio: playerRatio,
  }
}

const resolveCollectionEmbed = (
  parsed: URL,
  segments: Array<string>,
): EmbedResolverResult | undefined => {
  const listType = parsed.searchParams.get('listType')
  const list = parsed.searchParams.get('list')
  const channel = parsed.searchParams.get('channel')

  if (segments[1] === 'live_stream') {
    return channel ? composeChannelEmbed(channel) : undefined
  }

  // `/embed/videoseries?list=` and the bare `/embed/?list=` some WordPress plugins emit are the
  // same playlist spelled two ways.
  if (segments[1] !== 'videoseries' && segments.length !== 1) {
    return
  }

  // `listType=search` named a search query, not an id, and YouTube removed it in 2020: the
  // embed plays nothing and there is nothing to resolve it to.
  if (listType === 'search' || !list) {
    return
  }

  return listType === 'user_uploads' ? composeUploadsEmbed(list) : composeListEmbed(list)
}

const resolveTarget = (url: string): EmbedResolverResult | undefined => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const segments = parsed ? getPathSegments(parsed) : []

  if (segments[0] === 'embed' && parsed) {
    const embed = resolveCollectionEmbed(parsed, segments)

    // A `/embed/{id}` path names a video and falls through; the rest of the embed paths name
    // their content here or name nothing resolvable.
    if (embed || segments.length === 1 || nonVideoIds.has(segments[1])) {
      return embed
    }
  }

  // The Flash player took its playlist on `/p/{id}`, the playlist the modern url spells as
  // `list=PL{id}`, and the swf it points at is dead, so the id is the only thing left to rebuild
  // from. The publisher's `?hl=` and `&fs=1` are player chrome and go with the rest of the query.
  if (segments[0] === 'p') {
    const head = splitStrayParams(segments[1] ?? '').head
    // The id moves from a path segment into the query, so it is decoded first.
    const list = decodeSegment(head) ?? head

    return list ? composeListEmbed(`PL${list}`) : undefined
  }

  const videoId = extractVideoId(url)

  if (!videoId) {
    return
  }

  return composeVideoEmbed(videoId, readEmbedParams(url))
}

export const youtubeResolveEmbed: ResolveEmbed = (url, element) => {
  const target = resolveTarget(url)

  return target && { ...target, title: attr(element, 'title') }
}

// FC2's blog player shell on static.fc2.com, a page that builds only the YouTube player its query
// `id` names. The generic iframe placeholder for it carries no provider and no poster.
export const youtubeFc2EmbedResolver = createUrlEmbedResolver(
  ['static.fc2.com'],
  (url, element) => {
    const parsed = parseUrl(url)

    if (parsed?.pathname !== '/misc/blog/view/ext_youtube_player.html') {
      return
    }

    // FC2's iframe snippet also carries the id as `data-id`, which the shell never reads.
    const videoId = [parsed.searchParams.get('id'), attr(element, 'data-id')].find(
      (candidate) => candidate && isVideoId(candidate),
    )

    if (!videoId) {
      return
    }

    const title = parsed.searchParams.get('title')

    return {
      ...composeVideoEmbed(videoId),
      // The shell draws no title when the query `title` is the string "undefined".
      title: title && title !== 'undefined' ? title : undefined,
    }
  },
  { preferResolverSize: true },
)

// A YouTube player iframe, a frame of a watch, shorts or playlist page, or the Flash player.
export const youtubeIframeEmbedResolver = createUrlEmbedResolver(
  youtubeHosts,
  youtubeResolveEmbed,
  { preferResolverSize: true },
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

      return channel ? composeChannelEmbed(channel) : undefined
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
  { preferResolverSize: true },
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
