import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'

// GitLab's emoji element, holding the glyph with its gemoji name in data-name.
export const gitlabEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'gl-emoji',
  extract: (element) => {
    const name = attr(element, 'data-name')

    return resolveEmojiElement(element, { shortcode: name ? `:${name}:` : undefined })
  },
}
