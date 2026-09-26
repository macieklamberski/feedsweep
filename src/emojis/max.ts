import type { EmojiResolver } from '../types.js'
import { getFileStem, glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'

// The pixel size Max appends to every filename, as in `1F7E3_32.webp`.
const sizeSuffixRegex = /_\d+$/

// Max's emoji, as a post from a Max channel carries them. Their alt is often a "?".
export const maxEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="st.max.ru/emojis/" i]',
  extract: (element) => {
    const stem = getFileStem(element.getAttribute('src') ?? '').replace(sizeSuffixRegex, '')
    const glyph = glyphFromCodepoints(stem.toLowerCase())

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
