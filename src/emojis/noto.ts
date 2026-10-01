import type { EmojiResolver } from '../types.js'
import { glyphFromCodepoints, resolveEmojiImage } from '../utils/emojis.js'

// Noto emoji from Google Fonts, as Gmail inlines them into a mail sent on to a feed. The file is
// named by its size, and the codepoint is the directory above it.
export const notoEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="fonts.gstatic.com/s/e/notoemoji/" i]',
  extract: (element) => {
    const directory = (element.getAttribute('src') ?? '').split('/').at(-2) ?? ''
    const glyph = glyphFromCodepoints(directory.toLowerCase())

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
