import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Cocolog's pictograms, named in English with no alt. They have no Unicode counterpart to become.
export const cocologEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="emojies.cocolog-nifty.com/emoticon/" i]', // Cocolog
    'img[src*="/.shared/images/emoticon/" i]', // TypePad, which Cocolog runs on, from any of its hosts
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
