import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Seesaa's numbered pictograms, with no alt. `images_e` follows docomo's numbering, and like every
// carrier set holds ids with no Unicode counterpart, so the set stays pictures.
export const seesaaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="blog.seesaa.jp/images_g/" i]',
    'img[src*="blog.seesaa.jp/images_e/" i]',
    'img[src*="blog.seesaa.jp/images_w/emoji/" i]', // Another numbered set, under its emoji folder
    'img[src*="blog.seesaa.jp/images_o/" i]', // An older numbered set
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true, keepsPictures: true })
  },
}
