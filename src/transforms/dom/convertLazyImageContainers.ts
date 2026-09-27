import type { DomTransform } from '../../types.js'
import { imageFileRegex } from '../../utils/urls.js'
import { createImage } from '../../utils/widgets.js'

// A <div> or <figure> that parks the image url in a lazy attribute and builds the <img> with JS.
// A gallery widget renders one as <div class="…_gallery_img" data-src="…">.
export const convertLazyImageContainers: DomTransform = (context) => {
  const { lazySrcAttributes } = context

  return (document) => {
    for (const element of document.querySelectorAll('div, figure')) {
      // Without the extension check an AJAX loader url on the same attribute becomes an <img>.
      const src = lazySrcAttributes
        .map((attribute) => element.getAttribute(attribute))
        .find((value) => !!value && imageFileRegex.test(value))

      if (!src) {
        continue
      }

      // A container that already wraps media is a layout wrapper. The lazy attribute
      // belongs to the inner element, not to a missing image.
      if (element.querySelector('img, picture, video, iframe, source')) {
        continue
      }

      const image = createImage(document, { src })

      // A container with content, like a figure with its figcaption, keeps it beside the image.
      if (element.children.length > 0 || element.textContent?.trim()) {
        element.prepend(image)
        continue
      }

      element.replaceWith(image)
    }
  }
}
