import { getPathSegments, parseUrl } from 'trousse'
import type { EmbedResolverResult, ResolveEmbed } from '../types.js'
import { encodePathSegment } from '../utils/urls.js'
import { createUrlEmbedResolver } from '../utils/widgets.js'

const provider = 'yandexmusic'

// `music.yandex.by` is an alias of `.ru`, and `music.yandex.ua` no longer resolves.
const yandexMusicHosts = [
  'music.yandex.ru',
  'music.yandex.by',
  'music.yandex.com',
  'music.yandex.ua',
]

// The heights the share dialog writes: the track card, and the album or playlist card with its
// scrolling track list. Both players fill whatever width they get.
const trackHeight = 244
const listHeight = 556

type YandexMusicItem =
  | { kind: 'track'; track: string; album?: string }
  | { kind: 'album'; album: string }
  | { kind: 'playlist'; owner: string; playlist: string }

// The player's own reader of its route, in its iframe bundle, takes `track/{track}/{album}`,
// `track/{track}:{album}`, `album/{album}`, `album/{album}/track/{track}` and
// `playlist/{owner}/{kind}`, and ignores the color and layout segments the old share dialog wrote
// after them.
const readRoute = (route: Array<string>): YandexMusicItem | undefined => {
  const [kind, first, second, third] = route

  if (kind === 'track' && first) {
    const [track, album] = first.split(':')

    if (!track) {
      return
    }

    return {
      kind: 'track',
      track,
      album: album || second,
    }
  }

  if (kind === 'album' && first) {
    if (second === 'track' && third) {
      return {
        kind: 'track',
        track: third,
        album: first,
      }
    }

    return {
      kind: 'album',
      album: first,
    }
  }

  if (kind === 'playlist' && first && second) {
    return {
      kind: 'playlist',
      owner: first,
      playlist: second,
    }
  }
}

const readYandexMusicItem = (url: string): YandexMusicItem | undefined => {
  const [route, ...rest] = getPathSegments(url)

  // The retired Flash player, `/embed/{track}/track.swf`.
  if (route === 'embed') {
    const [track, file] = rest

    if (!track || file !== 'track.swf') {
      return
    }

    return {
      kind: 'track',
      track,
    }
  }

  if (route !== 'iframe') {
    return
  }

  // The old share dialog put the route in the hash, `/iframe/#album/{album}`, which the player
  // still reads and redirects onto its path.
  if (rest.length === 0) {
    const hash = parseUrl(url)?.hash.slice(1) ?? ''

    return readRoute(hash.split('/').filter(Boolean))
  }

  return readRoute(rest)
}

// The values come out of a fragment or a `{track}:{album}` pair, where a dot segment survives.
const composeYandexMusicEmbed = (item: YandexMusicItem): EmbedResolverResult | undefined => {
  if (item.kind === 'album') {
    const album = encodePathSegment(item.album)

    if (!album) {
      return
    }

    return {
      provider,
      id: `album/${item.album}`,
      src: `https://music.yandex.ru/iframe/album/${album}`,
      url: `https://music.yandex.ru/album/${album}`,
      height: listHeight,
    }
  }

  if (item.kind === 'playlist') {
    const owner = encodePathSegment(item.owner)
    const playlist = encodePathSegment(item.playlist)

    if (!owner || !playlist) {
      return
    }

    return {
      provider,
      id: `playlist/${item.owner}/${item.playlist}`,
      src: `https://music.yandex.ru/iframe/playlist/${owner}/${playlist}`,
      url: `https://music.yandex.ru/users/${owner}/playlists/${playlist}`,
      height: listHeight,
    }
  }

  const track = encodePathSegment(item.track)
  const album = item.album ? encodePathSegment(item.album) : ''

  if (!track || album === undefined) {
    return
  }

  // The track id alone addresses the track, so the album stays out of the key.
  const path = album ? `album/${album}/track/${track}` : `track/${track}`

  return {
    provider,
    id: `track/${item.track}`,
    src: `https://music.yandex.ru/iframe/${path}`,
    url: `https://music.yandex.ru/${path}`,
    height: trackHeight,
  }
}

const yandexMusicResolveEmbed: ResolveEmbed = (url) => {
  const item = readYandexMusicItem(url)

  if (!item) {
    return
  }

  return composeYandexMusicEmbed(item)
}

// Yandex Music's player iframe, on its path or hash route, and its retired Flash track player in
// an `<embed>` or `<object>`, which renders nothing and names the track in its path.
export const yandexMusicEmbedResolver = createUrlEmbedResolver(
  yandexMusicHosts,
  yandexMusicResolveEmbed,
)
