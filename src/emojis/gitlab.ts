import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { glyphFromShortcode, isEmojiShaped } from '../utils/emojis.js'

// GitLab's emoji element, holding the glyph with its gemoji name in data-name. A sanitizer
// dropping unknown elements would take the glyph with it.
export const gitlabEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'gl-emoji',
  extract: (element) => {
    const text = element.textContent ?? ''

    if (isEmojiShaped(text)) {
      return { glyph: text }
    }

    const name = attr(element, 'data-name')
    const shortcode = name ? `:${name}:` : undefined
    const glyph = glyphFromShortcode(shortcode)

    if (glyph) {
      return { glyph }
    }

    const fallback = text || shortcode

    if (fallback) {
      return { text: fallback }
    }
  },
}
