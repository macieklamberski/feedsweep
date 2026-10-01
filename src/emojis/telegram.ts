import type { EmojiResolver } from '../types.js'
import {
  getFileStem,
  glyphFromUtf8Hex,
  isEmojiShaped,
  noEmojiNames,
  resolveEmojiImage,
} from '../utils/emojis.js'
import { bgImage } from '../utils/styles.js'

const hosts = [
  'web.telegram.org/a/img-apple-', // Telegram Web A, in its 64 and 160 pixel sizes
  'web.telegram.org/k/assets/img/emoji/', // Telegram Web K
  'web.telegram.org/z/img-apple-', // Telegram Web Z
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

const paintedPath = 'telegram.org/img/emoji/'

// A channel post from Telegram's web preview, as feed bridges pass it on: an empty `i` or span
// painted with a file named by its glyph's UTF-8 bytes, like `F09F918D.png` for 👍.
export const telegramElementEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: `i[style*="${paintedPath}" i], span[style*="${paintedPath}" i]`,
  extract: (element) => {
    const text = element.textContent?.trim()

    if (text) {
      return isEmojiShaped(text) ? { glyph: text } : undefined
    }

    const url = bgImage(element)

    if (!url?.toLowerCase().includes(paintedPath)) {
      return
    }

    const glyph = glyphFromUtf8Hex(getFileStem(url))

    return glyph ? { glyph } : { image: url }
  },
}
