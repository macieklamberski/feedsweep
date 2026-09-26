import type { EmojiResolver } from '../types.js'
import { isEmojiShaped } from '../utils/emojis.js'

// A wrapper holding a standard emoji as the fallback. A reader cannot fetch the custom asset,
// and a sanitizer dropping unknown elements would take the fallback with it.
export const telegramEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'tg-emoji',
  extract: (element) => {
    const fallback = element.textContent

    // Removing an empty one would be a deletion this transform has no business making.
    if (!fallback) {
      return
    }

    return isEmojiShaped(fallback) ? { glyph: fallback } : { text: fallback }
  },
}
