import type { EmojiResolver } from '../types.js'
import { resolveEmojiImage } from '../utils/emojis.js'

// JUGEM's pictograms, whose alt is a Japanese word. They have no Unicode counterpart to become.
export const jugemEmojiResolver: EmojiResolver = {
  kind: 'emoji',
  selector: 'img[src*="picto0.jugem.jp/emoji/" i]',
  extract: (element) => {
    return resolveEmojiImage(element, { isStrong: true })
  },
}
