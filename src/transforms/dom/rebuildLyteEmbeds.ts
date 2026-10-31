import { encodePathSegment, getQueryParam, parseUrl } from 'trousse'
import {
  composeEmbedUrl,
  extractVideoId,
  isVideoId,
  readThumbnailVideoId,
  hosts as youtubeHosts,
} from '../../embeds/youtube.js'
import type { DomTransform, TransformContext } from '../../types.js'
import {
  attr,
  isBr,
  isElement,
  isNonWhitespaceText,
  isText,
  isWhitespaceText,
} from '../../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../../utils/urls.js'
import { createIframe, readRepairedCarrierUrl } from '../../utils/widgets.js'

// In a feed the plugin writes no facade. It writes the thumbnail linked to the post, with
// `alt="YouTube Video"`, then `<br /> <a href="https://youtu.be/{id}">Watch this video on
// YouTube</a>.<br />` when its "links" setting is on, the label in the site's language.
const feedThumbnailSelector = 'a:has(> img[alt="YouTube Video"])'

// The thumbnail is YouTube's poster url, or that url in the `origThumbUrl` param of the plugin's
// own `lyteCache.php` when it serves thumbnails locally. A bare <img> is claimed as a player, so
// the id has to have a video's shape.
const readFeedThumbnailVideoId = (
  image: Element,
  context: TransformContext,
): string | undefined => {
  const src = parseUrl(readRepairedCarrierUrl(image, context), placeholderBaseUrl)
  const cachedUrl = src?.pathname.toLowerCase().endsWith('/lytecache.php')
    ? getQueryParam(src.searchParams, 'origThumbUrl')
    : undefined
  const videoId = readThumbnailVideoId(cachedUrl ?? src)

  if (videoId && isVideoId(videoId)) {
    return videoId
  }
}

// Removes the label link that follows the thumbnail when it names the same video, with the break
// before it and the period the plugin writes after it.
const removeFeedLabel = (thumbnail: Element, videoId: string): void => {
  const between: Array<ChildNode> = []
  let node = thumbnail.nextSibling

  while (node && (isWhitespaceText(node) || isBr(node))) {
    between.push(node)
    node = node.nextSibling
  }

  if (!isElement(node)) {
    return
  }

  const url = parseUrlOnHosts(attr(node, 'href'), 'youtu.be')

  if (!url) {
    return
  }

  if (extractVideoId(url) !== videoId) {
    return
  }

  const after = node.nextSibling

  if (isText(after) && after.data.startsWith('.')) {
    after.data = after.data.slice(1)
  }

  for (const item of between) {
    item.remove()
  }

  node.remove()
}

const rebuildFeedThumbnails = (document: Document, context: TransformContext): void => {
  for (const thumbnail of document.querySelectorAll(feedThumbnailSelector)) {
    if (thumbnail.children.length > 1) {
      continue
    }

    if ([...thumbnail.childNodes].some(isNonWhitespaceText)) {
      continue
    }

    // The selector matched an `img` child, and the link holds no other element.
    const image = thumbnail.firstElementChild as Element
    const videoId = readFeedThumbnailVideoId(image, context)

    if (!videoId) {
      continue
    }

    // The plugin links the thumbnail to the post. A thumbnail linked to the video itself is a
    // link the author wrote.
    const href = attr(thumbnail, 'href')
    const link = parseUrlOnHosts(href, youtubeHosts)

    if (extractVideoId(link) === videoId) {
      continue
    }

    removeFeedLabel(thumbnail, videoId)
    const iframe = createIframe(document, composeEmbedUrl(videoId))

    thumbnail.replaceWith(iframe)
  }
}

// WP YouTube Lyte ships a facade whose id carries the video id and builds the iframe on click.
// It writes `div.lyMe#WYL_{id}` around `div.pL#lyte_{id}`.
export const rebuildLyteEmbeds: DomTransform = (context) => (document) => {
  for (const element of document.querySelectorAll('div.lyMe[id^="WYL_"], div.pL[id^="lyte_"]')) {
    // The inner lyte node arrives detached once its WYL wrapper has been replaced.
    if (!element.parentNode) {
      continue
    }

    // A playlist facade adds `playlist` to the outer class, and its id is a playlist id.
    if (element.closest('.lyMe.playlist')) {
      continue
    }

    // The id comes out of its attribute decoded, and the video id in it goes into a path.
    const videoId = element.id.slice(element.id.indexOf('_') + 1)
    const segment = encodePathSegment(videoId)

    if (!segment) {
      continue
    }

    const iframe = createIframe(document, composeEmbedUrl(segment))
    element.replaceWith(iframe)
  }

  rebuildFeedThumbnails(document, context)
}
