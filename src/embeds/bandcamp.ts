import {
  composeQuery,
  decodeSegment,
  encodePathSegment,
  getPathSegments,
  getQueryParam,
  type Nullish,
} from 'trousse'
import type { FieldCleaner, ResolveUrlEmbed } from '../types.js'
import { attr, text } from '../utils/dom.js'
import { parseUrlOnHosts } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'bandcamp'

// A release is either an album or a single track.
const releaseRegex = /^(album|track)=([^/]+)$/i
// An exclusive embed names its tracks with a signature. One track is the track the player plays.
const signedTrackRegex = /^tracks=([^/,]+)$/i
// The track number an album player opens on: `album=2182110545/t=38/` plays track 38.
const startTrackRegex = /^t=[^/]+$/i
// The large player with small artwork and no tracklist, spelled as the embed dialog writes it.
const playerLayout = 'size=large/tracklist=false/artwork=small/'
const sizes = {
  // The large player lays out as a strip 120 tall that fits its controls to any width.
  player: { height: 120 },
  video: { ratio: '16/9' },
}
const releaseKinds = ['album', 'track']

// The audio player spells its options as path segments (`EmbeddedPlayer/album=123/size=large/`)
// while the video player uses a query string (`VideoEmbed?track=123&bgcol=…`).
const videoPathRegex = /\/videoembed/i

// A player pointing at a track inside an album names both, and the two orders both occur: the
// modern path writes `album=` first and the legacy `v=2/` path writes `track=` first.
const readReleases = (url: URL): Array<[string, string]> => {
  const releases: Array<[string, string]> = []

  const claim = (kind: string, id: string) => {
    if (!releases.some(([named]) => named === kind)) {
      releases.push([kind, id])
    }
  }

  for (const segment of getPathSegments(url)) {
    const match = segment.match(releaseRegex)

    // A path value is decoded, like a query one, so the player url encodes it once.
    if (match) {
      claim(match[1].toLowerCase(), decodeSegment(match[2]) ?? match[2])
    }

    const signed = segment.match(signedTrackRegex)

    if (signed) {
      claim('track', decodeSegment(signed[1]) ?? signed[1])
    }
  }

  for (const kind of releaseKinds) {
    const id = getQueryParam(url.searchParams, kind)

    if (id) {
      claim(kind, id)
    }
  }

  return releases
}

export const extractBandcampRelease = (url: URL): string | undefined => {
  const releases = readReleases(url)
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

const bandcampResolveEmbed: ResolveUrlEmbed = (url, element) => {
  const release = extractBandcampRelease(url)

  if (!release) {
    return
  }

  const releases = readReleases(url)
  const [kind, id] = release.split('/')
  // The video player names a track and only a track: `VideoEmbed?album={id}` answers 404. A video
  // carrier whose only release is an album falls back to the audio player, which does serve it.
  const isVideo = videoPathRegex.test(url.pathname) && kind === 'track'
  const startTrack = getPathSegments(url).find((segment) => startTrackRegex.test(segment))
  const start = startTrack ? `${startTrack}/` : ''
  // A query id comes out decoded, and it goes into a path.
  const segments = new Map(releases.map(([named, value]) => [named, encodePathSegment(value)]))
  const albumId = segments.get('album')
  const trackId = segments.get('track')
  // The dialog writes the release first and a track picked off an album after the layout. Album
  // and track both stay: given the album alone the player opens on the first track.
  const head = albumId ? `album=${albumId}/` : `track=${trackId}/`
  const tail = albumId && trackId ? `track=${trackId}/` : ''
  const anchor = parseFallback(element)
  const pageUrl = attr(anchor, 'href')
  // Bandcamp writes the label as `{title} by {artist}`, and " by " appears inside real titles too.
  const title = text(anchor) ?? attr(element, 'title')

  return {
    provider,
    id: release,
    src: isVideo
      ? `https://bandcamp.com/VideoEmbed${composeQuery({ [kind]: id })}`
      : `https://bandcamp.com/EmbeddedPlayer/${head}${playerLayout}${tail}${start}`,
    url: pageUrl,
    ...(isVideo ? sizes.video : sizes.player),
    title,
  }
}

// Bandcamp's player iframe, whose fallback anchor is the only place the release page appears.
export const bandcampEmbedResolver = createUrlEmbedResolver(bandcampHosts, bandcampResolveEmbed)

export const bandcampFieldCleaners: Array<FieldCleaner> = [
  { provider, field: 'title', drop: 'YouTube video player' },
]
