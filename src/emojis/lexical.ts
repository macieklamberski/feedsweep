import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { isEmojiShaped } from '../utils/emojis.js'

// Lexical's emoji node, an empty span with the glyph in `data-lexical-emoji`.
export const lexicalEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'span[data-lexical-emoji]',
  extract: (element) => {
    const glyph = attr(element, 'data-lexical-emoji')

    // Some copies hold a `?` left by broken encoding, which names nothing.
    if (element.textContent?.trim() || !glyph || !isEmojiShaped(glyph)) {
      return
    }

    return { glyph }
  },
}
