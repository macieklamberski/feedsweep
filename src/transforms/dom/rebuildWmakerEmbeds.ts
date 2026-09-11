import { composeEmbedUrl, isFlashPlayerUrl } from '../../embeds/wmaker.js'
import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { createIframe } from '../../utils/widgets.js'

// WMaker's Flash player is dead and its .swf 404s, so today the item renders a click-to-load
// placeholder addressing nothing. The modern player lives at {origin}/embed/{articleId}/ and the
// article id is in the item's own permalink, which is what makes the repair computable offline.
export const rebuildWmakerEmbeds: DomTransform =
  ({ baseUrl }) =>
  (document) => {
    const elements = Array.from(document.querySelectorAll('object[data]')).filter((element) =>
      isFlashPlayerUrl(attr(element, 'data')),
    )

    // The embed route addresses the article rather than the video, and it serves one video for
    // it: an article carrying four objects still answers with a single mp4. Minting it once per
    // object would show that same video several times and lose the rest, so an item carrying more
    // than one is left as it stands. Measured at 18 of 383 carrier items across 394 feeds.
    if (elements.length !== 1) {
      return
    }

    const src = composeEmbedUrl(baseUrl)

    if (!src) {
      return
    }

    const iframe = createIframe(document, src)

    // The publisher's declared box, moved whole from the carrier they chose.
    for (const name of ['width', 'height']) {
      const value = attr(elements[0], name)

      if (value) {
        iframe.setAttribute(name, value)
      }
    }

    elements[0]?.replaceWith(iframe)
  }
