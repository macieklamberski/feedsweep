import type { DomTransform } from '../../types.js'
import { attr } from '../../utils/dom.js'
import { encodePathSegment } from '../../utils/urls.js'
import { createImage } from '../../utils/widgets.js'

// A SmartFrame picture shipped as a childless <smartframe-embed> that renders nothing unupgraded.
export const convertSmartframeEmbeds: DomTransform = () => (document) => {
  for (const embed of document.querySelectorAll('smartframe-embed[customer-id][image-id]')) {
    // Both come out of their attributes decoded, and both go into a path.
    const customerId = encodePathSegment(attr(embed, 'customer-id') ?? '')
    const imageId = encodePathSegment(attr(embed, 'image-id') ?? '')

    if (!customerId || !imageId) {
      continue
    }

    // embed.js falls back to an <img> at thumbs.smartframe.io/{customer}/{image}.webp when it
    // cannot run its viewer, and SmartFrame's WordPress plugin writes that same url into the feed
    // beside the element. The element names no page url.
    const image = createImage(document, {
      src: `https://thumbs.smartframe.io/${customerId}/${imageId}.webp`,
    })

    embed.replaceWith(image)
  }
}
