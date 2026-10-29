import type { DomTransform, TransformContext, UrlPattern } from '../../types.js'
import { attr, removeWithEmptyWrappers } from '../../utils/dom.js'
import { buildMediaKey, enclosureMarker } from '../../utils/enclosures.js'
import { findPosterEvidence, getVideoThumbnail } from '../../utils/images.js'
import { isUsableSrc, matchesUrlPattern, prepareUrl } from '../../utils/urls.js'
import { updateEmbedPlaceholder } from '../../utils/widgets.js'

// A player without a resolver, like JW Player, carries no data-embed-provider to match on, and
// a provider names no kind, so the video players are listed by the urls their resolvers mint.
const videoPlayers: Array<UrlPattern> = [
  { host: 'youtube.com', path: /^\/embed(?:\/|$)/i }, // YouTube player, not its live chat
  { host: 'youtu.be' }, // YouTube share links
  { host: 'player.vimeo.com' }, // Vimeo player
  { host: 'vimeo.com', path: /^\/video\//i }, // Vimeo video path
  { host: 'vimeo.com', path: /^\/(?:showcase|event)\/[^/]+\/embed/i }, // Vimeo showcase and event
  { host: 'jwplayer.com' }, // JW Player
  { host: 'dailymotion.com' }, // Dailymotion
  { host: 'wistia.net' }, // Wistia player
  { host: 'wistia.com' }, // Wistia legacy player
  { host: 'videopress.com' }, // VideoPress
  { host: 'video.wordpress.com' }, // VideoPress player as its resolver mints it
  { host: 'brightcove.net' }, // Brightcove player
  { host: 'streamable.com' }, // Streamable
  { host: 'v.redd.it' }, // Reddit-hosted video
  { host: 'rutube.ru', path: /^\/play\/embed\//i }, // Rutube player
  { host: 'vk.ru', path: /^\/(?:video|clip)_ext\.php$/i }, // VK video and clip players, not widgets
  { host: 'nbcnews.com', path: /^\/(?:news\/embedded-video|widget\/video-embed)\//i }, // NBC News
  { host: 'today.com', path: /\/embedded-video\//i }, // TODAY
]

const playerSelector = '[data-embed-src], iframe[src], video'

const getFileKeys = (player: Element, context: TransformContext): Array<string> => {
  return [player, ...player.querySelectorAll('source')]
    .map((file) => buildMediaKey(file, context))
    .filter(Boolean)
}

// An injected enclosure that repeats a body player: stripDuplicateEnclosures removes that copy
// later, with any poster set on it.
const findRepeats = (players: Array<Element>, context: TransformContext): Set<Element> => {
  const bodyKeys = new Set(
    players
      .filter((player) => !player.hasAttribute(enclosureMarker))
      .flatMap((player) => getFileKeys(player, context)),
  )
  const repeats = players.filter((player) => {
    return (
      player.hasAttribute(enclosureMarker) &&
      getFileKeys(player, context).some((key) => bodyKeys.has(key))
    )
  })

  return new Set(repeats)
}

// The video element of a video-led item: a native <video>, or an embed
// (placeholder/iframe) pointing at a known video host.
const findVideoElement = (players: Array<Element>): Element | undefined => {
  const isNative = (player: Element) => {
    return player.localName === 'video' && player.matches('video[src], video:has(> source[src])')
  }
  const isHostedEmbed = (player: Element) => {
    const src = player.getAttribute('data-embed-src') ?? player.getAttribute('src') ?? ''
    return player.localName !== 'video' && matchesUrlPattern(src, videoPlayers)
  }

  return players.find(isNative) ?? players.find(isHostedEmbed)
}

// Give the video its poster, then drop the now-redundant standalone image. By default an
// existing poster is kept (e.g. a YouTube resolver thumbnail). Pass overwrite to replace it
// with a better one.
const moveImageToVideoPoster = (
  image: Element,
  video: Element,
  context: TransformContext,
  overwrite = false,
): void => {
  const url = prepareUrl(attr(image, 'src'), context)

  if (url) {
    if (video.localName === 'video') {
      if (overwrite || !isUsableSrc(video.getAttribute('poster'))) {
        video.setAttribute('poster', url)
      }
    } else if (overwrite || !isUsableSrc(video.getAttribute('data-embed-thumbnail'))) {
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
  const players = [...document.querySelectorAll(playerSelector)]
  const repeats = findRepeats(players, context)
  const videos = players.filter((player) => !repeats.has(player))

  for (const image of videos.length ? document.querySelectorAll('img[src]') : []) {
    const src = image.getAttribute('src') ?? ''

    for (const video of videos) {
      const evidence = findPosterEvidence(src, video, context)

      if (!evidence) {
        continue
      }

      // Only a feed-defined enclosure thumbnail outranks a named poster, not a resolver's guess.
      const isFeedDefined = video.hasAttribute(enclosureMarker)
      moveImageToVideoPoster(image, video, context, evidence === 'id' && !isFeedDefined)
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

  // Beside a video with a thumbnail of its own, the enclosure is often a different picture. A feed
  // that repeats a body player as an enclosure lists the post's media, so the image is as often a
  // featured photo or a logo as the video's poster.
  const hasThumbnail = getVideoThumbnail(video) !== undefined
  const isPoster = !hasThumbnail && repeats.size === 0

  if (isPoster) {
    moveImageToVideoPoster(poster, video, context)
  }

  // Without the marker a repeat run reads them as the item's own images and moves none.
  for (const image of isPoster ? rest : [poster, ...rest]) {
    image.removeAttribute(enclosureMarker)
  }
}
