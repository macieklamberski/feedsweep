import type { EmojiResolver } from '../types.js'
import { attr } from '../utils/dom.js'
import { glyphFromShortcode, resolveEmojiImage } from '../utils/emojis.js'

// Bitrix forum and blog smilies, which carry the shortcode the author typed in data-code. Their
// files are numbered or named per site, so the shortcode is the only stable key.
export const bitrixEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="bx-smile" i]',
  extract: (element) => {
    const glyph =
      glyphFromShortcode(attr(element, 'data-code')) ?? glyphFromShortcode(attr(element, 'alt'))

    return resolveEmojiImage(element, { isStrong: true, glyph })
  },
}
