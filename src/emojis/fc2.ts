import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// FC2's pictograms under the shared emoji class. They are numbered in decimal, so `2640.gif` is
// not U+2640, and have no Unicode counterpart to become.
export const fc2EmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="emoji" i][src*=".fc2.com/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
