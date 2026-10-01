import { decodeSegment } from 'trousse'
import { attr } from '../utils/dom.js'
import { encodePathSegment, parseUrlOnHosts } from '../utils/urls.js'
import { createMarkupEmbedResolver } from '../utils/widgets.js'

const playerRatio = '16/9'

// Without /iframe the route answers 200 but is served x-frame-options: SAMEORIGIN.
// A fabricated id answers 404 on the /iframe route.
const composeEmbedUrl = (videoId: string): string => {
  return `https://embed.mediavine.com/videos/${encodePathSegment(videoId)}/iframe`
}

// Mediavine ships a video as an empty div.mv-video-target its script builds into a player.
export const mediavineWidgetEmbedResolver = createMarkupEmbedResolver(
  'div.mv-video-target[data-video-id]',
  (element) => {
    const videoId = attr(element, 'data-video-id')

    if (!videoId) {
      return
    }

    // Mediavine has no public watch page.
    return {
      provider: 'mediavine',
      id: videoId,
      src: composeEmbedUrl(videoId),
      ratio: playerRatio,
      title: attr(element, 'title'),
    }
  },
)

const scriptIdRegex = /^\/videos\/([^/]+)\.js$/

// The selector matches on a substring, so any host can spell `video.mediavine.com/videos` inside
// its own path and reach this. The path shape alone must not mint a Mediavine url.
const mediavineHosts = ['mediavine.com']

// Mediavine's older snippet: a loader script naming the video beside a div holding only its id.
// Neither renders: a reader strips the script, then the empty div.
export const mediavineScriptEmbedResolver = createMarkupEmbedResolver(
  'script[src*="video.mediavine.com/videos/"]',
  (element) => {
    // The selector matches a substring any host can carry, so the host is checked here.
    const parsed = parseUrlOnHosts(attr(element, 'src'), mediavineHosts)
    const videoId = parsed?.pathname.match(scriptIdRegex)?.[1]

    if (!videoId) {
      return
    }

    return {
      provider: 'mediavine',
      id: videoId,
      // The script path id is decoded, like the div's attribute, so the player url encodes it once.
      src: composeEmbedUrl(decodeSegment(videoId) ?? videoId),
      ratio: playerRatio,
    }
  },
)
