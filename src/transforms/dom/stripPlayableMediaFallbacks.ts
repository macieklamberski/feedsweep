import type { DomTransform } from '../../types.js'
import { isElement } from '../../utils/dom.js'
import { isUsableSrc } from '../../utils/urls.js'

const playerChildTags = ['source', 'track']

const hasPlayableSource = (media: Element): boolean => {
  if (isUsableSrc(media.getAttribute('src'))) {
    return true
  }

  for (const child of media.children) {
    if (child.localName === 'source' && isUsableSrc(child.getAttribute('src'))) {
      return true
    }
  }

  return false
}

// A <video> or <audio> with a source never renders its fallback content, yet a block in that
// fallback ends up under the working player once the paragraph passes split it out.
export const stripPlayableMediaFallbacks: DomTransform = () => (document) => {
  for (const media of document.querySelectorAll('video, audio')) {
    if (!hasPlayableSource(media)) {
      continue
    }

    for (const child of [...media.childNodes]) {
      if (isElement(child) && playerChildTags.includes(child.localName)) {
        continue
      }

      child.remove()
    }
  }
}
