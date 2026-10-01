import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Seesaa's numbered pictograms, with no alt. They have no Unicode counterpart to become.
export const seesaaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="blog.seesaa.jp/images_g/" i]',
    'img[src*="blog.seesaa.jp/images_e/" i]',
    'img[src*="blog.seesaa.jp/images_w/emoji/" i]', // Another numbered set, under its emoji folder
    'img[src*="blog.seesaa.jp/images_o/" i]', // An older numbered set
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
