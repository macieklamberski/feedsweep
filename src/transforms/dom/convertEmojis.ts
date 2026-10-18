import type { DomTransform } from '../../types.js'
import { batchSelectors, walkElements } from '../../utils/dom.js'
import {
  emojiImageAttribute,
  unwrapProxiedEmoji,
  withEmojiPresentation,
} from '../../utils/emojis.js'

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
      // A copy carrying the url behind an image proxy, matched only when the image itself is not,
      // since the copy has no ancestors for a selector to read.
      const target = unwrapProxiedEmoji(element)
      const matches = (selector: string): Element | undefined => {
        if (element.matches(selector)) {
          return element
        }

        if (target !== element && target.matches(selector)) {
          return target
        }
      }

      if (!selectors.some(matches)) {
        return
      }

      for (const resolver of emojiResolvers) {
        const matched = matches(resolver.selector)

        if (!matched) {
          continue
        }

        const result = resolver.extract(matched)

        if (!result) {
          continue
        }

        // An empty result would leave the wrapping element for stripEmptyTags to delete.
        if ('glyph' in result) {
          element.replaceWith(withEmojiPresentation(result.glyph))
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
