import type { EmojiResolver } from '../types.js'
import { isEmojiShaped, noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

const hosts = [
  'web.telegram.org/a/img-apple-', // Telegram Web A, in its 64 and 160 pixel sizes
  'web.telegram.org/k/assets/img/emoji/', // Telegram Web K
]

// The emoji images of Telegram's web clients, named by codepoint. Web A sometimes writes `?` as
// the alt.
export const telegramImageEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: hosts.map((host) => `img[src*="${host}" i]`).join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}

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
