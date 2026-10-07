import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// FC2's pictograms under the shared emoji class, numbered in decimal per carrier: `e` is au's icon
// number and `i` docomo's, and each holds ids with no Unicode counterpart. So `2640.gif` is not
// U+2640.
export const fc2EmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[class~="emoji" i][src*=".fc2.com/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
