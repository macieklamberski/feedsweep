import type { MediaResolverResult, WidgetResolver } from '../types.js'
import { attr } from '../utils/dom.js'

// Discourse 3.2 and later ships an uploaded video as an empty div only its web client hydrates.
// The div carries the upload's file url and thumbnail, never dimensions or an aspect ratio.
export const discourseMediaResolver: WidgetResolver = {
  step: 'block',
  kind: 'media',
  selector: '.video-placeholder-container[data-video-src]',
  extract: (element) => {
    const source = attr(element, 'data-video-src')

    if (!source) {
      return
    }

    const result: MediaResolverResult = { tag: 'video', src: source }
    const thumbnail = attr(element, 'data-thumbnail-src')

    if (thumbnail) {
      result.poster = thumbnail
    }

    return result
  },
}
