import type { EmojiResolver } from '../types.js'
import { noEmojiNames, resolveEmojiImage } from '../utils/emojis.js'

// JoyPixels from its CDN, including XenForo's emoji mode.
export const joypixelsEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="cdn.jsdelivr.net/joypixels/assets/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, names: noEmojiNames })
  },
}
