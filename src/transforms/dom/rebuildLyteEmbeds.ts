import { composeEmbedUrl } from '../../embeds/youtube.js'
import type { DomTransform } from '../../types.js'
import { createIframe } from '../../utils/widgets.js'

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
}
