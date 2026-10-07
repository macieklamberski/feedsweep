import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// FC2's pictograms under the shared emoji class. They are numbered in decimal, so `2640.gif` is
// not U+2640, and have no Unicode counterpart to become.
export const fc2EmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[class~="emoji" i][src*=".fc2.com/" i]',
    // The same pictograms pasted without the class, from FC2's own folders. A user's uploads sit
    // under a one-letter folder path, `/a/b/c/user/`, that none of these match.
    'img[src*=".fc2.com/emoji/" i]', // The dated library and the carrier sets
    'img[src*=".fc2.com/image/emoji/" i]',
    'img[src*=".fc2.com/image/icon/" i]',
    'img[src*=".fc2.com/image/e/" i]',
    'img[src*=".fc2.com/image/i/" i]',
    'img[src*=".fc2.com/image/v/" i]',
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
