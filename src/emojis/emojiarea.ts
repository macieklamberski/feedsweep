import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { resolveEmojiElement } from '../utils/emojis.js'
import { glyphFromGemojiName } from '../utils/gemoji.js'

// jQuery emojiarea's picker output, a span painted from a relative sprite sheet with the short
// name in its title, and sometimes the name as text too.
export const emojiareaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[class*="emoji-spritesheet-" i][title]',
  extract: (element) => {
    const name = attr(element, 'title')
    const text = element.textContent?.trim()

    if (text && text !== `:${name}:`) {
      return
    }

    return resolveEmojiElement(element, {
      glyph: glyphFromGemojiName(name),
      shortcode: name && `:${name}:`,
    })
  },
}
