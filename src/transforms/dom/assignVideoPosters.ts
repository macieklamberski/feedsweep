import { escapeRegex } from 'trousse'
import { extractVideoId } from '../../embeds/youtube.js'
import type { DomTransform, TransformContext } from '../../types.js'
import { removeWithEmptyWrappers } from '../../utils/dom.js'
import { updateEmbedPlaceholder } from '../../utils/widgets.js'
import { enclosureMarker } from './injectEnclosures.js'
import { buildMediaKey } from './stripDuplicateEnclosures.js'

// A YouTube thumbnail URL carries the video id in a `/vi/{id}/` segment, e.g.
// https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg. extractVideoId only reads
// watch/embed/short URLs, so the poster side needs its own match.
const thumbnailIdRegex = /\/vi\/([a-zA-Z0-9_-]{11})\//

// A player without a resolver, like JW Player, carries no data-embed-provider to match on.
const videoHostFragments = [
  'youtube.com', // YouTube
  'youtu.be', // YouTube share links
  'player.vimeo.com', // Vimeo player
  'vimeo.com/video', // Vimeo video path
  'jwplayer', // JW Player (cdn.jwplayer.com)
  'dailymotion.com', // Dailymotion
  'wistia', // Wistia (fast.wistia.net/.com)
  'videopress.com', // VideoPress (WordPress.com)
  'brightcove', // Brightcove
  'streamable.com', // Streamable
  'v.redd.it', // Reddit-hosted video
]
const videoHostRegex = new RegExp(videoHostFragments.map(escapeRegex).join('|'), 'i')

// Map each embedded video's id to its element (placeholders carry data-embed-*, a
// raw iframe carries src) so an id-matched poster image can be moved onto it.
const collectEmbedsByVideoId = (document: Document): Map<string, Element> => {
  const embeds = new Map<string, Element>()

  for (const element of document.querySelectorAll('[data-embed-src], iframe[src]')) {
    const ids = new Set<string>()

    const dataId = element.getAttribute('data-embed-id')
    if (dataId) {
      ids.add(dataId)
    }

    for (const attribute of ['data-embed-src', 'data-embed-url', 'src']) {
      const value = element.getAttribute(attribute)
      const id = value ? extractVideoId(value) : undefined
      if (id) {
        ids.add(id)
      }
    }

    for (const id of ids) {
      if (!embeds.has(id)) {
        embeds.set(id, element)
      }
    }
  }

  return embeds
}

const getFileKeys = (player: Element, context: TransformContext): Array<string> => {
  const keys: Array<string> = []

  for (const file of [player, ...player.querySelectorAll('source')]) {
    const key = buildMediaKey(file, context.cleanUrlFn)

    if (key) {
      keys.push(key)
    }
  }

  return keys
}

// The item's players, without an injected enclosure that repeats one of the body:
// stripDuplicateEnclosures removes that copy later, with any poster set on it.
const collectPlayers = (document: Document, context: TransformContext): Array<Element> => {
  const all = [...document.querySelectorAll('[data-embed-src], iframe[src], video')]
  const bodyKeys = new Set<string>()

  for (const player of all) {
    if (!player.hasAttribute(enclosureMarker)) {
      for (const key of getFileKeys(player, context)) {
        bodyKeys.add(key)
      }
    }
  }

  const players: Array<Element> = []

  for (const player of all) {
    const isRepeat =
      player.hasAttribute(enclosureMarker) &&
      getFileKeys(player, context).some((key) => bodyKeys.has(key))

    if (!isRepeat) {
      players.push(player)
    }
  }

  return players
}

// The video element of a video-led item: a native <video>, or an embed
// (placeholder/iframe) pointing at a known video host.
const findVideoElement = (players: Array<Element>): Element | undefined => {
  for (const player of players) {
    if (player.localName === 'video' && player.matches('video[src], video:has(> source[src])')) {
      return player
    }
  }

  for (const player of players) {
    const src = player.getAttribute('data-embed-src') ?? player.getAttribute('src') ?? ''

    if (player.localName !== 'video' && videoHostRegex.test(src)) {
      return player
    }
  }
}

// Give the video its poster, then drop the now-redundant standalone image. By default an
// existing poster is kept (e.g. a YouTube resolver thumbnail). Pass overwrite to replace it
// with a better one.
const moveImageToVideoPoster = (image: Element, video: Element, overwrite = false): void => {
  const url = image.getAttribute('src')

  if (url) {
    if (video.localName === 'video') {
      if (overwrite || !video.hasAttribute('poster')) {
        video.setAttribute('poster', url)
      }
    } else if (overwrite || !video.hasAttribute('data-embed-thumbnail')) {
      updateEmbedPlaceholder(video, { thumbnail: url })
    }
  }

  // injectEnclosures hangs a captioned image in a figure, and the caption describes the image.
  const figure = image.parentElement

  if (image.hasAttribute(enclosureMarker) && figure?.localName === 'figure') {
    figure.remove()
    return
  }

  removeWithEmptyWrappers(image)
}

// A video's poster shipped as a second image: a thumbnail beside its embed, or an image enclosure.
// WordPress lazy-embed plugins ship the YouTube thumbnail beside the embed.
export const assignVideoPosters: DomTransform = (context) => (document) => {
  // (A) An inline image whose URL is a thumbnail of an embedded video, matched by id.
  const embedsByVideoId = collectEmbedsByVideoId(document)
  if (embedsByVideoId.size > 0) {
    for (const image of document.querySelectorAll('img[src]')) {
      const id = image.getAttribute('src')?.match(thumbnailIdRegex)?.[1]
      const embed = id ? embedsByVideoId.get(id) : undefined
      if (!embed) {
        continue
      }

      // Only a feed-defined enclosure thumbnail outranks the inline image, not a resolver's guess.
      const isFeedDefined = embed.hasAttribute(enclosureMarker)
      moveImageToVideoPoster(image, embed, !isFeedDefined)
    }
  }

  // (B) An injected image enclosure on a video-led item: a video is embedded and
  // the item has no inline image of its own: the first image is the video's poster.
  const video = findVideoElement(collectPlayers(document, context))
  if (!video || document.querySelector(`img[src]:not([${enclosureMarker}])`)) {
    return
  }

  // Only the first image is the poster. An Omeka archive item sends each photo of the item as an
  // enclosure, and each later one is a picture of its own.
  const [poster, ...rest] = document.querySelectorAll(`img[${enclosureMarker}]`)

  if (!poster) {
    return
  }

  moveImageToVideoPoster(poster, video)

  // Without the marker a repeat run reads them as the item's own images and moves none.
  for (const image of rest) {
    image.removeAttribute(enclosureMarker)
  }
}
