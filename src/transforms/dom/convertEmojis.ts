import type { DomTransform } from '../../types.js'
import { batchSelectors, walkElements } from '../../utils/dom.js'
import { emojiImageAttribute } from '../../utils/emojis.js'

const wrapFallbackText = (document: Document, text: string): Element => {
  const span = document.createElement('span')

  span.setAttribute(emojiImageAttribute, '')
  span.textContent = text

  return span
}

const createEmojiImage = (document: Document, src: string, alt: string | undefined): Element => {
  const image = document.createElement('img')

  image.setAttribute('src', src)

  if (alt) {
    image.setAttribute('alt', alt)
  }

  image.setAttribute(emojiImageAttribute, '')

  return image
}

// Emoji images and wrappers, which render oversized or as nothing without the site's CSS.
export const convertEmojis: DomTransform = (context) => {
  const { emojiResolvers, resolveUrlFn, baseUrl } = context
  const selectors = batchSelectors(emojiResolvers.map((resolver) => resolver.selector))

  return (document) => {
    if (!selectors.length) {
      return
    }

    walkElements(document, (element) => {
      if (!selectors.some((batch) => element.matches(batch))) {
        return
      }

      for (const resolver of emojiResolvers) {
        if (!element.matches(resolver.selector)) {
          continue
        }

        const result = resolver.extract(element)

        if (!result) {
          continue
        }

        // An empty result would leave the wrapping element for stripEmptyTags to delete.
        if ('glyph' in result) {
          element.replaceWith(result.glyph)
          return
        }

        if ('text' in result) {
          element.replaceWith(wrapFallbackText(document, result.text))
          return
        }

        // The url comes from an attribute resolveRelativeUrls does not read.
        if ('image' in result) {
          const src = resolveUrlFn(result.image, baseUrl) ?? result.image
          element.replaceWith(createEmojiImage(document, src, result.alt))
          return
        }

        element.setAttribute(emojiImageAttribute, '')
        return
      }
    })
  }
}
