import type { DomTransform } from '../../types.js'
import { getLazyValue } from '../../utils/dom.js'
import { isUsableSrc } from '../../utils/urls.js'

// A <video> whose clip and poster urls sit in lazy data-* attributes, so nothing shows without JS.
export const fixLazyVideos: DomTransform = (context) => (document) => {
  for (const video of document.querySelectorAll('video')) {
    if (!isUsableSrc(video.getAttribute('poster'))) {
      const poster = getLazyValue(video, ['data-poster'])

      if (poster) {
        video.setAttribute('poster', poster)
      }
    }

    // Promote a lazy src only when the element itself has nothing to play from: a
    // usable src or a <source> child means the clip already resolves.
    if (isUsableSrc(video.getAttribute('src')) || video.querySelector('source')) {
      continue
    }

    const src = getLazyValue(video, context.lazySrcAttributes)

    if (src) {
      video.setAttribute('src', src)
    }
  }
}
