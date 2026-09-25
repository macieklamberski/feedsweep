import type { DomTransform } from '../../types.js'
import { getImageFingerprint, parseSrcset } from '../../utils/images.js'
import { isUrlShaped, isUsableSrc } from '../../utils/urls.js'

// Lazy image attributes also carry JSON blobs, which isUrlShaped alone lets through.
const isUsableLazyValue = (value: string): boolean => {
  return isUrlShaped(value) && !value.startsWith('{') && !value.startsWith('[')
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

// An <img> whose real src or srcset sits in a lazy attribute, or in a <noscript> twin beside it.
export const fixLazyImages: DomTransform = (context) => {
  const lazySrcSet = new Set(context.lazySrcAttributes)
  const lazySrcsetSet = new Set(context.lazySrcsetAttributes)
  const { lazySrcAttributes, lazySrcsetAttributes } = context
  const srcAttributes = ['src', ...lazySrcAttributes]
  const srcsetAttributes = ['srcset', ...lazySrcsetAttributes]

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
        for (const attribute of lazySrcAttributes) {
          const value = element.getAttribute(attribute)

          if (value && isUsableLazyValue(value)) {
            element.setAttribute('src', value)
            break
          }
        }
      }

      if (hasSrcsetCandidate) {
        for (const attribute of lazySrcsetAttributes) {
          const value = element.getAttribute(attribute)

          if (value && isUsableLazyValue(value)) {
            element.setAttribute('srcset', value)
            break
          }
        }
      }
    }

    // Extract the image from a noscript wrapper when an <img> of the same picture sits directly
    // before it. A noscript tracking pixel after a content image would otherwise replace it.
    const noscripts = document.querySelectorAll('noscript')

    for (const noscript of noscripts) {
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
