import { composeEmbedUrl, isFlashPlayerUrl } from '../../embeds/wmaker.js'
import type { DomTransform } from '../../types.js'
import { attr, parsePixelSize } from '../../utils/dom.js'
import { createIframe, setDimensions } from '../../utils/widgets.js'

// WMaker's Flash player is dead and its .swf 404s, so today the item renders a click-to-load
// placeholder addressing nothing. The modern player lives at {origin}/embed/{articleId}/ and the
// article id is in the item's own permalink, which is what makes the repair computable offline.
export const rebuildWmakerEmbeds: DomTransform =
  ({ baseUrl }) =>
  (document) => {
    const [element, ...others] = Array.from(document.querySelectorAll('object[data]')).filter(
      (candidate) => isFlashPlayerUrl(attr(candidate, 'data')),
    )

    // The embed route addresses the article rather than the video and serves one video for it: an
    // article carrying four objects still answers with a single mp4, so minting per object would
    // show that one video several times and lose the rest.
    if (!element || others.length) {
      return
    }

    const src = composeEmbedUrl(baseUrl)

    if (!src) {
      return
    }

    const iframe = createIframe(document, src)

    // The publisher's declared box, moved whole from the carrier they chose.
    setDimensions(iframe, {
      width: parsePixelSize(attr(element, 'width')),
      height: parsePixelSize(attr(element, 'height')),
    })

    element.replaceWith(iframe)
  }
