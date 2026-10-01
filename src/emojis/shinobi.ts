import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// Shinobi Blog's pictograms, numbered within lettered sets.
export const shinobiEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*=".shinobi.jp/emoji/icon/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
