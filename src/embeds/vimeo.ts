import {
  composeQuery,
  encodePathSegment,
  getFragmentParams,
  getPathSegments,
  getQueryParam,
  getQueryParams,
  isAnyOf,
  isHostOf,
  trimObject,
} from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, flashVar, keepIfMatches } from '../utils/dom.js'
import { digitsRegex, flashFileRegex, hexRegex, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver, createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'vimeo'

const sizes = {
  video: { ratio: '16/9' },
  showcase: { ratio: '16/9' },
  event: { ratio: '16/9' },
}

export const hosts = ['vimeo.com']

// The hosts that serve a video page or a player. Other subdomains serve files and assets, and the
// numbers in `av.vimeo.com/50935/740/135924474.mp4` are storage segments, not a video id.
const pageHosts = [
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'player2.vimeo.com',
  'staging.vimeo.com',
]

// A showcase and an album are playlists, a channel and a group are listings, an event is a
// livestream and an on-demand page is a store front, and each lives in its own id space: channel
// 927 and video 927 are both live and belong to different people.
const collectionPaths = ['showcase', 'album', 'channels', 'groups', 'event', 'ondemand']

// Vimeo's own pages sit where a video id does, and some carry a numeric id of their own:
// `/users/{userId}` and `/manage/folders/{folderId}` both read as a video, and user 152184 is
// also video 152184, which belongs to somebody else.
const sitePathSegments = [
  'about',
  'blog',
  'categories',
  'create',
  'features',
  'help',
  'join',
  'jobs',
  'log_in',
  'manage',
  'privacy',
  'search',
  'settings',
  'stock',
  'terms',
  'upgrade',
  'users',
  'watch',
]

// `/ondemand/{name}/{id}` and `/channels/{name}/{id}` name the video in the third segment.
const namedCollectionPaths = ['ondemand', 'channels']

// An event names its videos under `/videos/`, but its bare and `/embed` forms are the common ones
// and both would read as a video here.
const readCollectionVideoId = (segments: Array<string>): string | undefined => {
  const [collection, , route, videoId] = segments

  if (isAnyOf(collection, showcasePaths)) {
    if (!isAnyOf(route, 'video')) {
      return
    }

    return videoId
  }

  if (isAnyOf(collection, 'groups')) {
    if (!isAnyOf(route, 'videos')) {
      return
    }

    return videoId
  }

  if (isAnyOf(collection, namedCollectionPaths)) {
    const [, , namedVideoId] = segments

    if (segments.length !== 3) {
      return
    }

    return namedVideoId
  }
}

// `album` is what Vimeo called a showcase before renaming them in 2018, and
// `vimeo.com/album/{id}/embed` 301s onto the showcase player.
const showcasePaths = ['showcase', 'album']

// `vimeo.com/showcase/{id}` resolves through Vimeo's keyless oEmbed to a title, an author and a
// thumbnail.
const composeShowcaseEmbed = (showcaseId: string): EmbedResolverResult => {
  return {
    provider,
    id: `showcase/${showcaseId}`,
    src: `https://vimeo.com/showcase/${showcaseId}/embed`,
    url: `https://vimeo.com/showcase/${showcaseId}`,
    ...sizes.showcase,
  }
}

const resolveShowcaseEmbed = (url: URL): EmbedResolverResult | undefined => {
  const [collection, rawShowcaseId] = getPathSegments(url)

  if (!isAnyOf(collection, showcasePaths)) {
    return
  }

  const showcaseId = keepIfMatches(rawShowcaseId, digitsRegex)

  if (!showcaseId) {
    return
  }

  return composeShowcaseEmbed(showcaseId)
}

// `/embed/interaction` is the event player with Vimeo's interaction panel beside it.
const eventLayoutSegments = ['interaction']

// A livestream event, `vimeo.com/event/{id}`, played by `vimeo.com/event/{id}/embed`. The page
// refuses framing, and an unlisted event's player and oEmbed both need its hash.
const resolveEventEmbed = (
  url: URL,
  element: Element | undefined,
): EmbedResolverResult | undefined => {
  const [route, rawEventId, ...rest] = getPathSegments(url)

  if (!isAnyOf(route, 'event')) {
    return
  }

  const eventId = keepIfMatches(rawEventId, digitsRegex)

  if (!eventId) {
    return
  }

  const [embedOrHash] = rest
  const tail = isAnyOf(embedOrHash, 'embed') ? rest.slice(1) : rest
  const [hashOrLayout] = tail
  const hash = keepIfMatches(hashOrLayout, hexRegex)
  const layout = hash ? tail.slice(1) : tail
  const [layoutName] = layout

  // A chat embed or any other route under the event is not its player.
  if (layout.length > 1 || (layoutName && !isAnyOf(layoutName, eventLayoutSegments))) {
    return
  }

  const path = hash ? `${eventId}/${hash}` : eventId

  return {
    provider,
    id: hash ? `event/${eventId}:${hash}` : `event/${eventId}`,
    src: `https://vimeo.com/event/${eventId}/embed${hash ? `/${hash}` : ''}`,
    url: `https://vimeo.com/event/${path}`,
    ...sizes.event,
    title: attr(element, 'title'),
  }
}

type VimeoReference = {
  id: string
  hash?: string
}

const readReference = (url: URL): VimeoReference | undefined => {
  if (!isHostOf(url, pageHosts)) {
    return
  }

  const segments = getPathSegments(url)
  const [section] = segments

  // A `progressive_redirect` url is the video's own file. Its owner can limit the player to their
  // own site while the signed file plays anywhere.
  if (isAnyOf(section, 'progressive_redirect')) {
    return
  }

  // The Flash player carried no id in the path at all: moogaloop.swf?clip_id={id}.
  const clipId = getQueryParam(url.searchParams, 'clip_id')

  if (clipId) {
    return { id: clipId }
  }

  if (isAnyOf(section, sitePathSegments)) {
    return
  }

  if (isAnyOf(section, collectionPaths)) {
    const id = keepIfMatches(readCollectionVideoId(segments), digitsRegex)

    if (!id) {
      return
    }

    return { id }
  }

  // A numeric video id matches the hash alphabet, so only a segment after an id counts as one.
  const hashIndex = segments.findIndex((segment, index) => {
    const previous = segments.slice(0, index).at(-1)

    return previous !== undefined && hexRegex.test(segment) && digitsRegex.test(previous)
  })
  // The last numeric segment, which is the video in every remaining spelling: `/{id}`,
  // `/video/{id}` and the review pages.
  const path = hashIndex === -1 ? segments : segments.slice(0, hashIndex)
  const id = keepIfMatches(
    path.findLast((segment) => digitsRegex.test(segment)),
    digitsRegex,
  )

  if (!id) {
    return
  }

  if (hashIndex !== -1) {
    const [hash] = segments.slice(hashIndex)

    return {
      id,
      hash,
    }
  }

  return {
    id,
    hash: getQueryParam(url.searchParams, 'h'),
  }
}

// The Flash player could also take the clip from its flashvars, and `moogaloop_local.swf` names
// it nowhere in its src.
const readFlashReference = (url: URL, element: Element | undefined): VimeoReference | undefined => {
  if (!flashFileRegex.test(url.href)) {
    return
  }

  const clipId = flashVar(element, 'clip_id')

  if (!clipId) {
    return
  }

  return { id: clipId }
}

export const extractVimeoId = (url: URL): string | undefined => {
  return readReference(url)?.id
}

// The player url every caller that recovers an id has to build. Params are given as values, not
// as a ready query string, so one carrying an `&` cannot open a parameter of its own. A start
// offset is not one of them: the player reads it from the fragment only.
export const composeEmbedUrl = (
  videoId: string,
  params?: Record<string, string>,
  start?: string,
): string => {
  const query = composeQuery(params)
  const fragment = start ? composeQuery({ t: start }).replace('?', '#') : ''

  return `https://player.vimeo.com/video/${videoId}${query}${fragment}`
}

// Whether the player loops. The start offset is read apart, since it travels in the fragment.
const vimeoEmbedParams = ['loop']

// The player seeks to `t` in the fragment, `#t=30s`, and ignores a `t` in the query, which a page
// url shared with a start carries.
const readStart = (url: URL): string | undefined => {
  return getFragmentParams(url, ['t']).t ?? getQueryParams(url.search, ['t']).t
}

// The `title` a share snippet writes is usually the video's own title, but sometimes a player
// label. The labels are not filtered. They are localised into at least five languages and some
// name a plugin, not the platform, so any list of them goes stale.
export const vimeoResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const reference = readReference(url) ?? readFlashReference(url, element)

  if (!reference) {
    return resolveShowcaseEmbed(url) ?? resolveEventEmbed(url, element)
  }

  const { id: videoId, hash } = reference
  // A `clip_id` comes out of the query decoded, and it goes into a path.
  const segment = encodePathSegment(videoId)
  const title = element ? attr(element, 'title') : undefined
  const params = {
    // The player takes the hash only as h=: the /video/{id}/{hash} path spelling is a 404.
    ...trimObject({ h: hash }, Boolean),
    ...getQueryParams(url.search, vimeoEmbedParams),
  }

  return {
    provider,
    // The hash travels in the id: an oEmbed lookup for the bare id answers 404.
    id: hash ? `${videoId}:${hash}` : videoId,
    src: composeEmbedUrl(segment, params, readStart(url)),
    // Without the hash the page loses its title and its video, so it stays on the url too.
    url: `https://vimeo.com/${segment}${hash ? `/${encodePathSegment(hash)}` : ''}`,
    ...sizes.video,
    title,
    // TODO: no thumbnail. Vimeo posters are not derivable from the id and need an oEmbed lookup.
  }
}

// The player url for a caller holding a url nothing has checked: a page builder stores whatever
// the publisher pasted, so the host is checked here the way the factory checks it for a carrier.
export const readVimeoEmbedSrc = (link: string): string | undefined => {
  const url = parseUrlOnHosts(link, hosts)

  if (!url) {
    return
  }

  return vimeoResolveEmbed(url)?.src
}

// A Vimeo player iframe, a frame of a video, showcase or event page, or the Flash moogaloop player.
export const vimeoIframeEmbedResolver = createUrlEmbedResolver(hosts, vimeoResolveEmbed)

// MetaSlider Pro's Vimeo slide: an empty div that only the plugin's script builds into a player.
export const vimeoMetasliderEmbedResolver = createMarkupEmbedResolver(
  'li.ms-vimeo div.vimeo[data-id]',
  (element) => {
    const videoId = attr(element, 'data-id')

    if (!videoId) {
      return
    }

    const pageUrl = new URL(`https://vimeo.com/${encodePathSegment(videoId)}`)

    return vimeoResolveEmbed(pageUrl)
  },
)

export const vimeoFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: /^vimeo[ -](?:video player|video|player)(?: \d+)?$/ },
  // The AllVideos Joomla plugin.
  { provider, field: 'title', drop: 'JoomlaWorks AllVideos Player' },
]

// `dnt=1` turns off Vimeo's viewer tracking: no cookies and no analytics. `autoplay=1` starts
// playback on the click that loads the player. Never `background=1`, which mutes the video and
// strips its controls.
export const vimeoRenderHint: EmbedRenderHint = {
  provider,
  params: { dnt: '1' },
  autoplayParams: { autoplay: '1' },
}
