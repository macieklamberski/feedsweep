import { getPathSegments, getQueryParam, isAnyOf, parseUrl } from 'trousse'
import { composeEmbedUrl, extractVideoId, isVideoId } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import {
  attr,
  isBr,
  isElement,
  isNonWhitespaceText,
  isText,
  isWhitespaceText,
} from '../../utils/dom.js'
import { parseUrlOnHosts, placeholderBaseUrl } from '../../utils/urls.js'
import { createIframe } from '../../utils/widgets.js'

// In a feed the plugin writes no facade. It writes the thumbnail linked to the post, with
// `alt="YouTube Video"`, then `<br /> <a href="https://youtu.be/{id}">Watch this video on
// YouTube</a>.<br />` when its "links" setting is on, the label in the site's language.
const feedThumbnailSelector = 'a:has(> img[alt="YouTube Video"])'

// The thumbnail is `i.ytimg.com/vi/{id}/hqdefault.jpg`, or that url in the `origThumbUrl` param of
// the plugin's own `lyteCache.php` when it serves thumbnails locally.
const readThumbnailVideoId = (src: string): string | undefined => {
  const url = parseUrl(src, placeholderBaseUrl)

  if (!url) {
    return
  }

  const cachedUrl = url.pathname.toLowerCase().endsWith('/lytecache.php')
    ? getQueryParam(url.searchParams, 'origThumbUrl')
    : undefined

  if (cachedUrl) {
    return readThumbnailVideoId(cachedUrl)
  }

  if (url.hostname !== 'i.ytimg.com') {
    return
  }

  const [route, videoId] = getPathSegments(url)

  if (isAnyOf(route, 'vi') && videoId && isVideoId(videoId)) {
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

  if (extractVideoId(url.href) !== videoId) {
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

const rebuildFeedThumbnails = (document: Document): void => {
  for (const thumbnail of document.querySelectorAll(feedThumbnailSelector)) {
    if (thumbnail.children.length > 1) {
      continue
    }

    if ([...thumbnail.childNodes].some(isNonWhitespaceText)) {
      continue
    }

    const videoId = readThumbnailVideoId(attr(thumbnail.firstElementChild, 'src') ?? '')

    if (!videoId) {
      continue
    }

    // The plugin links the thumbnail to the post. A thumbnail linked to the video itself is a
    // link the author wrote.
    if (extractVideoId(attr(thumbnail, 'href') ?? '') === videoId) {
      continue
    }

    removeFeedLabel(thumbnail, videoId)
    thumbnail.replaceWith(createIframe(document, composeEmbedUrl(videoId)))
  }
}

// WP YouTube Lyte ships a facade whose id carries the video id and builds the iframe on click.
// It writes `div.lyMe#WYL_{id}` around `div.pL#lyte_{id}`.
export const rebuildLyteEmbeds: DomTransform = () => (document) => {
  for (const element of document.querySelectorAll('div.lyMe[id^="WYL_"], div.pL[id^="lyte_"]')) {
    // The inner lyte node arrives detached once its WYL wrapper has been replaced.
    if (!element.parentNode) {
      continue
    }

    // A playlist facade adds `playlist` to the outer class, and its id is a playlist id.
    if (element.closest('.lyMe.playlist')) {
      continue
    }

    const videoId = element.id.slice(element.id.indexOf('_') + 1)

    if (!videoId) {
      continue
    }

    const iframe = createIframe(document, composeEmbedUrl(videoId))
    element.replaceWith(iframe)
  }

  rebuildFeedThumbnails(document)
}
