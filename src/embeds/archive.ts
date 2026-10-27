import { composeQuery, encodePathSegment, getPathSegments, getQueryParam, isAnyOf } from 'trousse'
import type {
  EmbedRenderHint,
  EmbedResolverResult,
  FieldCleaner,
  ResolveUrlEmbed,
} from '../types.js'
import { attr, flashVar, flashVars } from '../utils/dom.js'
import { audioFileRegex, parseUrlOnHosts, pickQueryParams } from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  getEmbedSize,
} from '../utils/widgets.js'

const provider = 'archive'

export const hosts = ['archive.org']

// Not `download`: that route serves the files themselves.
// `stream` is the retired BookReader url, and it 302s to `details/{identifier}?view=theater`.
const itemRoutes = ['embed', 'details', 'stream']

// `embed/{identifier}/{file}` plays that file alone, and `embed/{identifier}` the item's first.
const fileRoutes = ['embed', 'details']

type SegmentParts = {
  head: string
  file: string
}

const readSegmentParts = (url: URL | undefined): SegmentParts => {
  const [route = '', segment = '', ...rest] = url ? getPathSegments(url) : []

  return {
    head: isAnyOf(route, itemRoutes) ? segment : '',
    file: isAnyOf(route, fileRoutes) ? rest.join('/') : '',
  }
}

export const extractArchiveIdentifier = (link: string): string | undefined => {
  const { head } = readSegmentParts(parseUrlOnHosts(link, hosts))

  if (!head) {
    return
  }

  return head
}

// `playlist` puts the item's whole file list in the player, `list_height` sizes that list, and
// `start` and `end` name a span within a recording.
const archiveEmbedParams = ['playlist', 'list_height', 'start', 'end']

// Every item has a thumbnail at `archive.org/services/img/{identifier}` and a page at
// `archive.org/details/{identifier}`. The thumbnail service answers 200 for anything, a generic
// placeholder png for an unknown identifier.
const composeEmbedResult = (identifier: string, query = '', file = ''): EmbedResolverResult => {
  const path = file ? `${identifier}/${file}` : identifier

  return {
    provider,
    id: identifier,
    src: `https://archive.org/embed/${path}${query}`,
    url: `https://archive.org/details/${path}`,
    thumbnail: `https://archive.org/services/img/${identifier}`,
  }
}

const sizes = {
  // The modern audio player is a controls bar 30 tall at every width, and it fills any width.
  audio: { height: 30 },
  video: { ratio: '16/9' },
}

// `embed/{identifier}` serves every kind of item, so the declared box or type only picks the kind.
// Every item declared under 200 tall is audio, and the bar it gets is 30 tall whatever the box.
const audioCarrierHeightLimit = 200

const declaresAudioPlayer = (element: Element): boolean => {
  if (attr(element, 'type')?.toLowerCase().startsWith('audio/')) {
    return true
  }

  const { height } = getEmbedSize(element, 0)

  return height !== undefined && height < audioCarrierHeightLimit
}

const readItemEmbed = (url: URL | undefined): EmbedResolverResult | undefined => {
  const { head: identifier, file } = readSegmentParts(url)

  if (!identifier) {
    return
  }

  // The parameters that say what plays are carried over; the rest is dropped.
  const query = composeQuery(pickQueryParams(url?.search ?? '', archiveEmbedParams))

  return composeEmbedResult(identifier, query, file)
}

export const archiveResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const embed = readItemEmbed(url)

  if (!embed) {
    return
  }

  const result = { ...embed, title: attr(element, 'title') }

  // Height alone: a width beside it reads as a ratio, and the box grows while the bar stays 30.
  if (element && declaresAudioPlayer(element)) {
    return { ...result, ...sizes.audio }
  }

  return { ...result, ...sizes.video }
}

// The Internet Archive's player iframe, which renders on its own but names no poster or page link.
export const archiveIframeEmbedResolver = createUrlEmbedResolver(hosts, archiveResolveEmbed)

// A WordPress audio block or a hand-written `<audio>` naming the item's page, which no browser
// plays. An element that also names a file under `download` or on a storage host plays that.
export const archiveAudioEmbedResolver = createMarkupEmbedResolver('audio', (element) => {
  const embeds: Array<EmbedResolverResult> = []

  for (const carrier of [element, ...element.querySelectorAll('source')]) {
    const src = attr(carrier, 'src')

    if (!src) {
      continue
    }

    const url = parseUrlOnHosts(src, hosts)
    const embed = url && readItemEmbed(url)

    if (!embed) {
      return
    }

    embeds.push(embed)
  }

  const [embed] = embeds

  if (!embed) {
    return
  }

  // A post that also frames the same file already plays it, and the dead element stays. The
  // iframe resolver runs first, so that frame is a placeholder by now.
  const placeholders = element.ownerDocument.querySelectorAll('[data-embed-src]')

  if (Array.from(placeholders).some((other) => attr(other, 'data-embed-src') === embed.src)) {
    return
  }

  return { ...embed, ...sizes.audio }
})

const flowPlayerPathRegex = /^\/(?:flow|flv)\//i
const xspfPlayerPathRegex = /^\/audio\/xspf_player\.swf$/i
// The WordPress audio player swf, uploaded into an item of its own or beside the files it plays.
const itemPlayerPathRegex = /^\/download\/.+\/player\.swf$/i
// `archive.org/download/{identifier}/{file}`, or `/{n}/items/{identifier}/{file}` on a storage host.
const itemFilePathRegex = /^\/+(?:download|\d+\/items)\/(?<identifier>[^/]+)\/(?<file>.+)/i
// The segment after `archive.org/download/` on any subdomain.
// Both dialects write the file as `archive.org/download/{identifier}/{file}`, on the playlist
// entry for a video and on the clip's `baseUrl` for audio.
const downloadIdentifierRegex = /\/\/(?:[\w-]+\.)*archive\.org\/download\/([^/'"?&]+)\//i

// A `url` entry in either config dialect, key bare or quoted.
const configFileRegex = /\burl['"]?\s*:\s*['"]([^'"]+)['"]/g

// The swf is the same for audio and video, so only the files the config names tell them apart.
const namesAudioFile = (config: string): boolean => {
  const files = Array.from(config.matchAll(configFileRegex), (match) => match[1])

  return files.some((file) => {
    return audioFileRegex.test(file)
  })
}

// The XSPF player loads `audio/xspf-maker.php?identifier={identifier}`, a playlist of the item.
const readXspfPlayer = (player: URL): EmbedResolverResult | undefined => {
  const playlist = parseUrlOnHosts(getQueryParam(player.searchParams, 'playlist_url'), hosts)
  const identifier = getQueryParam(playlist?.searchParams, 'identifier')

  if (!identifier) {
    return
  }

  // A query identifier comes out decoded, and it goes into a path.
  return { ...composeEmbedResult(encodePathSegment(identifier)), ...sizes.audio }
}

// The `soundFile` flashvar names one file of an item that can hold hundreds, so the file is kept.
const readItemPlayer = (element: Element | undefined): EmbedResolverResult | undefined => {
  const soundFile = parseUrlOnHosts(flashVar(element, 'soundFile'), hosts)
  const item = soundFile?.pathname.match(itemFilePathRegex)?.groups

  if (!item?.identifier) {
    return
  }

  return { ...composeEmbedResult(item.identifier, '', item.file), ...sizes.audio }
}

const archiveFlashResolveEmbed: ResolveUrlEmbed = (url, element) => {
  if (xspfPlayerPathRegex.test(url.pathname)) {
    return readXspfPlayer(url)
  }

  if (itemPlayerPathRegex.test(url.pathname)) {
    return readItemPlayer(element)
  }

  if (!flowPlayerPathRegex.test(url.pathname)) {
    return
  }

  // The config arrives as the `flashVars` attribute or, on the older player, as a `config` query.
  const config = flashVars(element) ?? getQueryParam(url.searchParams, 'config')
  const identifier = config?.match(downloadIdentifierRegex)?.[1]

  if (!identifier || !config) {
    return
  }

  const result = composeEmbedResult(encodePathSegment(identifier))

  if (namesAudioFile(config)) {
    return { ...result, ...sizes.audio }
  }

  return { ...result, ...sizes.video }
}

// The archive's retired Flash players: Flowplayer, which names its item only in the Flash config,
// the XSPF audio player and the WordPress audio player swf an item hosts.
export const archiveFlashEmbedResolver = createUrlEmbedResolver(hosts, archiveFlashResolveEmbed)

export const archiveFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'Embedded digital audio resource' },
  { provider, field: 'title', drop: 'Archive.org' },
  // A copied YouTube snippet with the src swapped.
  { provider, field: 'title', drop: 'YouTube video player' },
]

// Starts playback on the click that loads the player, for video and audio items alike.
export const archiveRenderHint: EmbedRenderHint = {
  provider,
  autoplayParams: { autoplay: '1' },
}
