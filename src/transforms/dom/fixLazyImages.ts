import { coerceNumber } from 'trousse'
import type { DomTransform } from '../../types.js'
import { getElementDimensions, getLazyValue, pixelDimensionLimit } from '../../utils/dom.js'
import { getImageFingerprint, parseSrcset } from '../../utils/images.js'
import * as styles from '../../utils/styles.js'
import { isUrlShaped, isUsableSrc } from '../../utils/urls.js'

// Lazy image attributes also carry JSON blobs, which isUrlShaped alone lets through.
const isUsableLazyValue = (value: string): boolean => {
  return isUrlShaped(value) && !value.startsWith('{') && !value.startsWith('[')
}

const isPixelLength = (value: number | undefined): boolean => {
  return value !== undefined && value <= pixelDimensionLimit
}

// Only the pixel-sized declarations go, so every other rule stays as the source wrote it.
const dropPixelStyleDimensions = (element: Element): void => {
  const pixelProperties = ['width', 'height'].filter((property) => {
    return isPixelLength(coerceNumber(styles.pixels(element, property)))
  })

  if (pixelProperties.length === 0) {
    return
  }

  styles.removeDeclarations(element, pixelProperties)
}

// A lazy loader sizes its placeholder gif at a pixel, in attributes or inline style, which then
// reads as a tracking pixel once the real src is in place.
const dropPixelDimensions = (element: Element): void => {
  const { width, height } = getElementDimensions(element)

  if (isPixelLength(width)) {
    element.removeAttribute('width')
  }

  if (isPixelLength(height)) {
    element.removeAttribute('height')
  }

  dropPixelStyleDimensions(element)
}

// A data: or blank src is a lazy placeholder and names no picture.
const getImageFingerprints = (
  element: Element,
  srcAttributes: Array<string>,
  srcsetAttributes: Array<string>,
): Set<string> => {
  const urls: Array<string> = []

  for (const attribute of srcAttributes) {
    urls.push(element.getAttribute(attribute) ?? '')
  }

  for (const attribute of srcsetAttributes) {
    const srcset = element.getAttribute(attribute)

    for (const candidate of srcset ? parseSrcset(srcset) : []) {
      urls.push(candidate.url)
    }
  }

  const fingerprints = new Set<string>()

  for (const url of urls) {
    if (!isUsableSrc(url) || !isUsableLazyValue(url) || url.startsWith('data:')) {
      continue
    }

    fingerprints.add(getImageFingerprint(url))
  }

  return fingerprints
}

// An <img> whose real src or srcset sits in a lazy attribute, or in a <noscript> twin beside it,
// and a gallery whose pictures sit only in its <noscript> fallback.
export const fixLazyImages: DomTransform = (context) => {
  const lazySrcSet = new Set(context.lazySrcAttributes)
  const lazySrcsetSet = new Set(context.lazySrcsetAttributes)
  const { lazySrcAttributes, lazySrcsetAttributes } = context
  const srcAttributes = ['src', ...lazySrcAttributes]
  const srcsetAttributes = ['srcset', ...lazySrcsetAttributes]
  const galleryNoscriptSelector = context.galleryNoscriptSelectors.join(', ')

  // A gallery that also renders its pictures beside the fallback would show each one twice.
  const hasVisibleTwin = (noscript: Element): boolean => {
    const visibleFingerprints = new Set<string>()

    for (const image of noscript.parentElement?.querySelectorAll('img') ?? []) {
      if (image.closest('noscript')) {
        continue
      }

      for (const fingerprint of getImageFingerprints(image, srcAttributes, srcsetAttributes)) {
        visibleFingerprints.add(fingerprint)
      }
    }

    return [...noscript.querySelectorAll('img')].some((image) => {
      const fingerprints = getImageFingerprints(image, srcAttributes, srcsetAttributes)

      return [...fingerprints].some((fingerprint) => visibleFingerprints.has(fingerprint))
    })
  }

  return (document) => {
    // <source> included: flattenPictureElements reads its srcset next and would drop the AVIF one.
    const elements = document.querySelectorAll('img, source')

    for (const element of elements) {
      let hasSrcCandidate = false
      let hasSrcsetCandidate = false

      for (const name of element.getAttributeNames()) {
        if (!hasSrcCandidate && lazySrcSet.has(name)) {
          hasSrcCandidate = true
        }

        if (!hasSrcsetCandidate && lazySrcsetSet.has(name)) {
          hasSrcsetCandidate = true
        }

        if (hasSrcCandidate && hasSrcsetCandidate) {
          break
        }
      }

      // Promote the real src/srcset but keep the original lazy attributes in place.
      if (hasSrcCandidate) {
        const src = getLazyValue(element, lazySrcAttributes, isUsableLazyValue)

        if (src) {
          element.setAttribute('src', src)
          dropPixelDimensions(element)
        }
      }

      if (hasSrcsetCandidate) {
        const srcset = getLazyValue(element, lazySrcsetAttributes, isUsableLazyValue)

        if (srcset) {
          element.setAttribute('srcset', srcset)
        }
      }
    }

    // Extract the image from a noscript wrapper when an <img> of the same picture sits directly
    // before it. A noscript tracking pixel after a content image would otherwise replace it.
    const noscripts = document.querySelectorAll('noscript')

    for (const noscript of noscripts) {
      const isGalleryFallback =
        galleryNoscriptSelector &&
        noscript.matches(galleryNoscriptSelector) &&
        !hasVisibleTwin(noscript)

      if (isGalleryFallback) {
        noscript.outerHTML = noscript.innerHTML
        continue
      }

      const sibling = noscript.previousElementSibling
      const image = noscript.querySelector('img')

      if (sibling?.localName !== 'img' || !image) {
        continue
      }

      const siblingFingerprints = getImageFingerprints(sibling, srcAttributes, srcsetAttributes)
      const imageFingerprints = getImageFingerprints(image, srcAttributes, srcsetAttributes)
      const isPlaceholder = siblingFingerprints.size === 0
      const isSamePicture = [...imageFingerprints].some((fingerprint) => {
        return siblingFingerprints.has(fingerprint)
      })

      if (!isPlaceholder && !isSamePicture) {
        continue
      }

      sibling.remove()
      noscript.outerHTML = noscript.innerHTML
    }
  }
}
