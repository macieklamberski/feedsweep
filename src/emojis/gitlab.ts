import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromEmojiName } from '../utils/gemoji.js'

// GitLab's emoji element, holding the glyph with its gemoji name in data-name.
export const gitlabEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'gl-emoji',
  extract: (element) => {
    const name = attr(element, 'data-name')
    const shortcode = name ? `:${name}:` : undefined
    const fallbackSrc = attr(element, 'data-fallback-src')

    // A custom emoji has no glyph, only the picture in fallback-src. GitLab leaves the element
    // empty or wraps its own image of it, alt included.
    if (fallbackSrc && attr(element, 'data-unicode-version') === 'custom') {
      return { image: fallbackSrc, alt: shortcode }
    }

    return resolveEmojiElement(element, { glyph: glyphFromEmojiName(name), shortcode })
  },
}
