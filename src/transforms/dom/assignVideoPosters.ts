import { escapeRegex } from 'trousse'
import type { DomTransform, TransformContext } from '../../types.js'
import { removeWithEmptyWrappers } from '../../utils/dom.js'
import { buildMediaKey } from '../../utils/enclosures.js'
import { findPosterEvidence, getVideoThumbnail } from '../../utils/images.js'
import { updateEmbedPlaceholder } from '../../utils/widgets.js'
import { enclosureMarker } from './injectEnclosures.js'

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
      if (overwrite || !video.getAttribute('poster')) {
        video.setAttribute('poster', url)
      }
    } else if (overwrite || !video.getAttribute('data-embed-thumbnail')) {
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
  // (A) Any image, inline or an enclosure, that something static ties to a player.
  const videos = collectPlayers(document, context)

  for (const image of videos.length ? document.querySelectorAll('img[src]') : []) {
    const src = image.getAttribute('src') ?? ''

    for (const video of videos) {
      const evidence = findPosterEvidence(src, video, context.cleanUrlFn)

      if (!evidence) {
        continue
      }

      // Only a feed-defined enclosure thumbnail outranks a named poster, not a resolver's guess.
      const isFeedDefined = video.hasAttribute(enclosureMarker)
      moveImageToVideoPoster(image, video, evidence === 'id' && !isFeedDefined)
      break
    }
  }

  // (B) An injected image enclosure on a video-led item with no inline image of its own. An
  // enclosure sits outside the body, so the first one is the poster of a player with none.
  const video = findVideoElement(videos)
  if (!video || document.querySelector(`img[src]:not([${enclosureMarker}])`)) {
    return
  }

  // Only the first image is the poster. An Omeka archive item sends each photo of the item as an
  // enclosure, and each later one is a picture of its own.
  const [poster, ...rest] = document.querySelectorAll(`img[${enclosureMarker}]`)

  if (!poster) {
    return
  }

  // Beside a video with a thumbnail of its own, the enclosure is often a different picture.
  const hasThumbnail = getVideoThumbnail(video) !== undefined

  if (!hasThumbnail) {
    moveImageToVideoPoster(poster, video)
  }

  // Without the marker a repeat run reads them as the item's own images and moves none.
  for (const image of hasThumbnail ? [poster, ...rest] : rest) {
    image.removeAttribute(enclosureMarker)
  }
}
