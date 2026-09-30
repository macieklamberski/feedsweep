import { decodeSegment, getPathSegments, type Nullish, parseUrl } from 'trousse'
import type { FieldCleaner, ResolveEmbed } from '../types.js'
import { attr, text } from '../utils/dom.js'

const provider = 'bandcamp'

import {
  composeQuery,
  encodePathSegment,
  parseUrlOnHosts,
  placeholderBaseUrl,
} from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

// A release is either an album or a single track.
const releaseRegex = /^(album|track)=([^/]+)$/
// The track number an album player opens on, which the embed dialog writes when a track is picked.
const startTrackRegex = /^t=[^/]+$/
// The player with no `size` segment, Bandcamp's own default layout. It lays out as a strip 100
// tall at any width and leaves the rest of the frame blank.
const playerHeight = 100
const releaseKinds = ['album', 'track']

// The audio player spells its options as path segments (`EmbeddedPlayer/album=123/size=large/`)
// while the video player uses a query string (`VideoEmbed?track=123&bgcol=…`).
const videoPathRegex = /\/videoembed/i

// A player pointing at a track inside an album names both, and the two orders both occur: the
// modern path writes `album=` first and the legacy `v=2/` path writes `track=` first.
const readReleases = (link: string): Array<[string, string]> => {
  const parsed = parseUrl(link, placeholderBaseUrl)
  const releases: Array<[string, string]> = []

  if (!parsed) {
    return releases
  }

  const claim = (kind: string, id: string) => {
    if (!releases.some(([named]) => named === kind)) {
      releases.push([kind, id])
    }
  }

  for (const segment of getPathSegments(parsed)) {
    const match = segment.match(releaseRegex)

    // A path value is decoded, like a query one, so the player url encodes it once.
    if (match) {
      claim(match[1], decodeSegment(match[2]) ?? match[2])
    }
  }

  for (const kind of releaseKinds) {
    const id = parsed.searchParams.get(kind)

    if (id) {
      claim(kind, id)
    }
  }

  return releases
}

export const extractBandcampRelease = (link: string): string | undefined => {
  const releases = readReleases(link)
  // The track, not the first spelled: that gave two tracks off one album the same id.
  // Naming both is what the builder writes when a publisher picks a track off an album page.
  const release = releases.find(([kind]) => kind === 'track') ?? releases[0]

  return release ? `${release[0]}/${release[1]}` : undefined
}

const bandcampHosts = ['bandcamp.com']

const parseFallback = (element: Nullish<Element>): Element | undefined => {
  if (!element) {
    return
  }

  // Re-parsed because jsdom keeps iframe content as text, where querySelector finds no anchor.
  // linkedom exposes it as child elements, and `innerHTML` is the view the two parsers agree on.
  const holder = element.ownerDocument.createElement('div')
  holder.innerHTML = element.innerHTML

  return Array.from(holder.querySelectorAll('a[href]')).find((anchor) =>
    parseUrlOnHosts(attr(anchor, 'href'), bandcampHosts),
  )
}

const bandcampResolveEmbed: ResolveEmbed = (url, element) => {
  const parsed = parseUrl(url, placeholderBaseUrl)
  const release = extractBandcampRelease(url)

  if (!parsed || !release) {
    return
  }

  const releases = readReleases(url)
  const [kind, id] = release.split('/')
  // The video player names a track and only a track: `VideoEmbed?album={id}` answers 404. A video
  // carrier whose only release is an album falls back to the audio player, which does serve it.
  const isVideo = videoPathRegex.test(parsed.pathname) && kind === 'track'
  const startTrack = getPathSegments(parsed).find((segment) => startTrackRegex.test(segment))
  const start = startTrack ? `${startTrack}/` : ''
  // Album and track both stay: given the album alone the player opens on the first track.
  const selection = releaseKinds
    .flatMap((wanted) => releases.filter(([named]) => named === wanted))
    // A query id comes out decoded, and it goes into a path.
    .map(([named, value]) => `${named}=${encodePathSegment(value)}/`)
    .join('')
  const anchor = parseFallback(element)
  const pageUrl = attr(anchor, 'href')
  // Bandcamp writes the label as `{title} by {artist}`, and " by " appears inside real titles too.
  const title = text(anchor) ?? attr(element, 'title')

  return {
    provider,
    id: release,
    src: isVideo
      ? `https://bandcamp.com/VideoEmbed${composeQuery({ [kind]: id })}`
      : `https://bandcamp.com/EmbeddedPlayer/${selection}${start}`,
    url: pageUrl,
    height: isVideo ? undefined : playerHeight,
    title,
  }
}

// Bandcamp's player iframe, whose fallback anchor is the only place the release page appears.
// The default player outranks a box drawn for a preset it no longer loads, such as `size=large`.
export const bandcampEmbedResolver = createUrlEmbedResolver(bandcampHosts, bandcampResolveEmbed, {
  preferResolverSize: true,
})

export const bandcampFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'YouTube video player' },
]
