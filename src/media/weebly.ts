import type { MediaResolver } from '../types.js'
import { flashVars, paramValue, parsePixelSize } from '../utils/dom.js'
import { audioFileRegex, imageFileRegex, parseUrlOnHosts, videoFileRegex } from '../utils/urls.js'
import { readCarrierUrl } from '../utils/widgets.js'

const weeblyHost = 'weebly.com'
const videoAppPath = '/weebly/apps/generateVideo.php'
const audioPlayerPath = '/weebly/apps/audioPlayer2.swf'

// The upload path is /uploads/b/{user}-{pathId}/{name}, which only the poster url carries.
const posterUrlRegex = /url\(\s*['"]?([^'")]*\/uploads\/[^'")]+)['"]?\s*\)/

// Some posters arrive as //www.weebly.comhttp://{site}/uploads/…, the site origin concatenated
// onto an absolute url. The url after the prefix is the one that serves.
const mangledPosterPrefixRegex = /^\/\/www\.weebly\.com(?=https?:\/\/)/

// The first class admits no dot, so `..` never reaches a minted path.
const safeUploadPathRegex = /^[\w-][\w.-]*(?:\/[\w-][\w.-]*)*$/

// A wrapper already holding a real player is a third-party embed sitting in Weebly's video
// block, not an upload facade. Replacing it would destroy whatever resolved it.
const resolvedSelector = '[data-embed-src], video, audio'
const liveIframeSelector = 'iframe[src]:not([src="about:blank"])'

// Weebly ships an uploaded video as a wrapper around an about:blank iframe its player JS fills.
// Weebly stores the upload and its poster under one name, so the poster url also names the mp4.
// The file url is not written anywhere in the markup.
export const weeblyMediaResolver: MediaResolver = {
  kind: 'media',
  selector: '.wsite-video-wrapper',
  extract: (element) => {
    // A wrapper holding a live player is a third-party embed that replacing would destroy.
    if (element.querySelector(resolvedSelector) || element.querySelector(liveIframeSelector)) {
      return
    }

    // The wrapper's numeric id is the element id, not the upload name, and 404s as a file name.
    // Real wrappers carry no title="Video: …" to take the name from.
    const styleText = element.querySelector('style')?.textContent ?? ''
    const posterUrl = styleText.match(posterUrlRegex)?.[1]?.replace(mangledPosterPrefixRegex, '')

    if (!posterUrl || !imageFileRegex.test(posterUrl)) {
      return
    }

    return {
      tag: 'video',
      // The stored name keeps its _NNN suffix and the style block often writes a cache-buster past
      // it, …/clip_176.jpg?1600, so only the extension changes between the two files.
      src: posterUrl.replace(imageFileRegex, '.mp4$2'),
      // Weebly writes the poster protocol-relative, //www.weebly.com/uploads/…, and
      // convertWidgets gives it a scheme.
      poster: posterUrl,
    }
  },
}

// The video block before the wrapper: an iframe onto a player page whose query names the upload
// and its poster by path. Both files serve from Weebly's own apex under /uploads/, whatever site
// they belong to. The same route renders the map block, which names no upload and stays a frame.
export const weeblyIframeMediaResolver: MediaResolver = {
  kind: 'media',
  selector: `iframe[src*="${weeblyHost}${videoAppPath}"]`,
  extract: (element) => {
    const page = parseUrlOnHosts(readCarrierUrl(element), weeblyHost)

    if (page?.pathname !== videoAppPath) {
      return
    }

    const video = page.searchParams.get('video') ?? ''
    const image = page.searchParams.get('image') ?? ''

    if (!safeUploadPathRegex.test(video) || !videoFileRegex.test(video)) {
      return
    }

    return {
      tag: 'video',
      src: `https://www.${weeblyHost}/uploads/${video}`,
      poster:
        safeUploadPathRegex.test(image) && imageFileRegex.test(image)
          ? `https://www.${weeblyHost}/uploads/${image}`
          : undefined,
      height: parsePixelSize(page.searchParams.get('height')),
    }
  },
}

// The Flash audio block: the player swf is gone, and the mp3 url and its label sit in flashvars.
export const weeblyFlashMediaResolver: MediaResolver = {
  kind: 'media',
  selector: [
    `object[data*="${weeblyHost}${audioPlayerPath}"]`,
    `embed[src*="${weeblyHost}${audioPlayerPath}"]`,
  ].join(', '),
  extract: (element) => {
    const player = parseUrlOnHosts(readCarrierUrl(element), weeblyHost)

    if (player?.pathname !== audioPlayerPath) {
      return
    }

    const config = new URLSearchParams(flashVars(element) ?? paramValue(element, 'flashvars'))
    const src = config.get('soundFile')

    if (!src || !audioFileRegex.test(src)) {
      return
    }

    return {
      tag: 'audio',
      src,
      title: config.get('titles') ?? undefined,
    }
  },
}
