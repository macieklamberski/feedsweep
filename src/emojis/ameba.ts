import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Ameba's pictures, whose alt is the Japanese name of the picture. Marked, never converted.
export const amebaEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: [
    'img[src*="stat100.ameba.jp/blog/ucs/img/char/" i]', // The built-in set, also served from c.stat100
    'img[src*="stat.ameba.jp/blog/ucs/img/char/" i]', // The same set from the older host
    'img[src*="emoji.ameba.jp/img/" i]', // Emoji uploaded by the blog's author
  ].join(', '),
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
