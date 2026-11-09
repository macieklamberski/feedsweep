import type { DomTransform, TransformContext } from '../../types.js'
import { hasText } from '../../utils/dom.js'
import * as styles from '../../utils/styles.js'
import { imageFileRegex } from '../../utils/urls.js'
import { createImage } from '../../utils/widgets.js'

// Slides a slider script shows as an empty <div> or <a> painted with an inline background image.
const backgroundSlideSelectors = [
  ':is(.slider-on-content, .slider-on-box) > .slider-image', // ShopPad Blog Studio
]

const backgroundSlideSelector = backgroundSlideSelectors.join(', ')

const findSrc = (element: Element, context: TransformContext): string | undefined => {
  // Without the extension check an AJAX loader url on the same attribute becomes an <img>.
  const lazySrc = context.lazySrcAttributes
    .map((attribute) => element.getAttribute(attribute))
    .find((value) => !!value && imageFileRegex.test(value))

  if (lazySrc) {
    return lazySrc
  }

  if (element.matches(backgroundSlideSelector)) {
    return styles.bgImage(element)
  }
}

// A <div> or <figure> that parks the image url in a lazy attribute, or a slide that parks it in
// its background, and builds the <img> with JS. A gallery widget renders one as
// <div class="…_gallery_img" data-src="…">.
export const convertLazyImageContainers: DomTransform = (context) => {
  return (document) => {
    for (const element of document.querySelectorAll(`div, figure, ${backgroundSlideSelector}`)) {
      const src = findSrc(element, context)

      if (!src) {
        continue
      }

      // A container that already wraps media is a layout wrapper. The lazy attribute
      // belongs to the inner element, not to a missing image.
      if (element.querySelector('img, picture, video, iframe, source')) {
        continue
      }

      const image = createImage(document, { src })

      // A container with content, like a figure with its figcaption, keeps it beside the image,
      // and a linked slide keeps its link around it.
      if (element.matches('a') || element.children.length > 0 || hasText(element)) {
        element.prepend(image)
        continue
      }

      element.replaceWith(image)
    }
  }
}
