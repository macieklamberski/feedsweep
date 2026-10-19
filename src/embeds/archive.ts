import { getPathSegments, isHostOrSubdomainOf, parseUrl } from 'trousse'
import type { EmbedRenderHint, EmbedResolverResult, FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, flashVar, flashVars } from '../utils/dom.js'
import {
  audioFileRegex,
  composeQuery,
  parseUrlOnHosts,
  pickQueryParams,
  placeholderBaseUrl,
  splitStrayParams,
} from '../utils/urls.js'
import {
  createMarkupEmbedResolver,
  createUrlEmbedResolver,
  getEmbedSize,
} from '../utils/widgets.js'

const provider = 'archive'

const archiveHosts = ['archive.org']

// Not `download`: that route serves the files themselves.
// `stream` is the retired BookReader url, and it 302s to `details/{identifier}?view=theater`.
const itemRoutes = ['embed', 'details', 'stream']

// `embed/{identifier}/{file}` plays that file alone, and `embed/{identifier}` the item's first.
const fileRoutes = ['embed', 'details']

type SegmentParts = {
  head: string
  strayParams: string
  file: string
}

// Some publisher tooling wrote `embed/{identifier}&playlist=1`, an ampersand where the query
// should begin, so the whole tail lands inside the path segment.
const readSegmentParts = (link: string): SegmentParts => {
  const [route = '', segment = '', ...rest] = getPathSegments(link)
  const { head, strayParams } = splitStrayParams(itemRoutes.includes(route) ? segment : '')

  return {
    head,
    strayParams,
    file: fileRoutes.includes(route) ? rest.join('/') : '',
  }
}

export const extractArchiveIdentifier = (link: string): string | undefined => {
  const { head } = readSegmentParts(link)

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

// The modern audio player is a controls bar 30 tall at every width, and it fills any width.
const audioPlayerHeight = 30
const videoPlayerRatio = '16/9'

// `embed/{identifier}` serves every kind of item, so the declared box only picks the kind. Every
// item declared under 200 tall is audio, and the bar it gets is 30 tall whatever the box.
const audioCarrierHeightLimit = 200

const declaresAudioPlayer = (element: Element): boolean => {
  const { height } = getEmbedSize(element, 0)

  return height !== undefined && height < audioCarrierHeightLimit
}

const readItemEmbed = (url: string): EmbedResolverResult | undefined => {
  const { head: identifier, strayParams, file } = readSegmentParts(url)

  if (!identifier) {
    return
  }

  // The parameters that say what plays are carried over; the rest is dropped. Anything the
  // ampersand form stranded in the path is read alongside the real query, since that spelling
  // 404s and rejoining it is what makes those embeds work at all.
  const search = parseUrl(url, placeholderBaseUrl)?.search ?? ''
  const query = composeQuery({
    ...pickQueryParams(search, archiveEmbedParams),
    // The `&` spelling 404s, so what it stranded in the path is rejoined as query.
    ...pickQueryParams(strayParams, archiveEmbedParams),
  })

  return composeEmbedResult(identifier, query, file)
}

export const archiveResolveEmbed: ResolveEmbed = (url, element) => {
  const embed = readItemEmbed(url)

  if (!embed) {
    return
  }

  const result = { ...embed, title: attr(element, 'title') }

  // Height alone: a width beside it reads as a ratio, and the box grows while the bar stays 30.
  if (element && declaresAudioPlayer(element)) {
    return { ...result, height: audioPlayerHeight }
  }

  return { ...result, ratio: videoPlayerRatio }
}

// The Internet Archive's player iframe, which renders on its own but names no poster or page link.
export const archiveIframeEmbedResolver = createUrlEmbedResolver(archiveHosts, archiveResolveEmbed)

// A WordPress audio block or a hand-written `<audio>` naming the item's page, which no browser
// plays. An element that also names a file under `download` or on a storage host plays that.
export const archiveAudioEmbedResolver = createMarkupEmbedResolver('audio', (element) => {
  const embeds: Array<EmbedResolverResult> = []

  for (const carrier of [element, ...element.querySelectorAll('source')]) {
    const src = attr(carrier, 'src')

    if (!src) {
      continue
    }

    const embed = isHostOrSubdomainOf(src, archiveHosts) ? readItemEmbed(src) : undefined

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

  return { ...embed, height: audioPlayerHeight }
})

const flowPlayerPathRegex = /^\/+(?:flow|flv)\//
const xspfPlayerPathRegex = /^\/+audio\/xspf_player\.swf$/
// The WordPress audio player swf, uploaded into an item of its own or beside the files it plays.
const itemPlayerPathRegex = /^\/+download\/.+\/player\.swf$/
// `archive.org/download/{identifier}/{file}`, or `/{n}/items/{identifier}/{file}` on a storage host.
const itemFilePathRegex = /^\/+(?:download|\d+\/items)\/([^/]+)\/(.+)/
// The segment after `archive.org/download/` on any subdomain.
// Both dialects write the file as `archive.org/download/{identifier}/{file}`, on the playlist
// entry for a video and on the clip's `baseUrl` for audio.
const downloadIdentifierRegex = /\/\/(?:[\w-]+\.)*archive\.org\/download\/([^/'"?&]+)\//

// A `url` entry in either config dialect, key bare or quoted.
const configFileRegex = /\burl['"]?\s*:\s*['"]([^'"]+)['"]/g

// The swf is the same for audio and video, so only the files the config names tell them apart.
const namesAudioFile = (config: string): boolean => {
  return Array.from(config.matchAll(configFileRegex), (match) => match[1]).some((file) => {
    return audioFileRegex.test(file)
  })
}

// The XSPF player loads `audio/xspf-maker.php?identifier={identifier}`, a playlist of the item.
const readXspfPlayer = (player: URL): EmbedResolverResult | undefined => {
  const playlist = parseUrlOnHosts(player.searchParams.get('playlist_url') ?? '', archiveHosts)
  const identifier = playlist?.searchParams.get('identifier')

  if (!identifier) {
    return
  }

  return { ...composeEmbedResult(identifier), height: audioPlayerHeight }
}

// The `soundFile` flashvar names one file of an item that can hold hundreds, so the file is kept.
const readItemPlayer = (element: Element | undefined): EmbedResolverResult | undefined => {
  const soundFile = parseUrlOnHosts(flashVar(element, 'soundFile'), archiveHosts)
  const [, identifier, file] = soundFile?.pathname.match(itemFilePathRegex) ?? []

  if (!identifier) {
    return
  }

  return { ...composeEmbedResult(identifier, '', file), height: audioPlayerHeight }
}

const archiveFlashResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)

  if (!parsed) {
    return
  }

  if (xspfPlayerPathRegex.test(parsed.pathname)) {
    return readXspfPlayer(parsed)
  }

  if (itemPlayerPathRegex.test(parsed.pathname)) {
    return readItemPlayer(element)
  }

  if (!flowPlayerPathRegex.test(parsed.pathname)) {
    return
  }

  // The config arrives as the `flashVars` attribute or, on the older player, as a `config` query.
  const config = flashVars(element) ?? parsed.searchParams.get('config')
  const identifier = config?.match(downloadIdentifierRegex)?.[1]

  if (!identifier || !config) {
    return
  }

  const result = composeEmbedResult(identifier)

  if (namesAudioFile(config)) {
    return { ...result, height: audioPlayerHeight }
  }

  return { ...result, ratio: videoPlayerRatio }
}

// The archive's retired Flash players: Flowplayer, which names its item only in the Flash config,
// the XSPF audio player and the WordPress audio player swf an item hosts.
export const archiveFlashEmbedResolver = createUrlEmbedResolver(
  archiveHosts,
  archiveFlashResolveEmbed,
)

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
